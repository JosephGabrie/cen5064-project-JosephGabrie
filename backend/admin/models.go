package admin

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math"
	"math/big"
	"regexp"
	"strings"

	"MTVSChool/attendance"
	"MTVSChool/auth"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmptyClassName             = errors.New("class name cannot be empty")
	ErrEmptySubject               = errors.New("class subject cannot be empty")
	ErrInvalidRoomFormat          = errors.New("room number must be 1-20 alphanumeric characters (e.g. 101, Room 204B, Lab-3)")
	ErrMissingTeacher             = errors.New("assigned teacher is required")
	ErrInvalidTeacherRole         = errors.New("assigned user must have the teacher role")
	ErrEmptyStudentID             = errors.New("student_id is required for enrollment")
	ErrDuplicateEnrollment        = errors.New("student is already enrolled in this class")
	ErrEmptyUserName              = errors.New("first name and last name are required")
	ErrEmptyUserEmail             = errors.New("email address is required")
	ErrWeakPassword               = errors.New("password must be at least 6 characters long")
	ErrMissingParentOrStudentID   = errors.New("both parent_id and student_id are required")
	ErrInvalidParentRole          = errors.New("selected parent user must have the parent role")
	ErrInvalidStudentRoleForLink  = errors.New("selected child user must have the student role")
	ErrDuplicateParentStudentLink = errors.New("student is already linked to this parent")
	validRoomNumberPattern        = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9\s\-]{0,19}$`)
)

// SchoolMetrics holds school-wide KPI metrics for the Admin Dashboard overview.
type SchoolMetrics struct {
	TotalStudents       int     `json:"total_students"`
	TotalTeachers       int     `json:"total_teachers"`
	TotalParents        int     `json:"total_parents"`
	TotalAdmins         int     `json:"total_admins"`
	ActiveClasses       int     `json:"active_classes"`
	StudentTeacherRatio float64 `json:"student_teacher_ratio"`
	AttendanceRate      float64 `json:"attendance_rate"`
	AttendanceStatus    string  `json:"attendance_status"`
	PresentToday        int     `json:"present_today"`
	AbsentToday         int     `json:"absent_today"`
	TardyToday          int     `json:"tardy_today"`
	TotalRecordedToday  int     `json:"total_recorded_today"`
}

// EvaluateAttendanceStatus classifies the daily school-wide attendance rate into an operational health label.
func (m *SchoolMetrics) EvaluateAttendanceStatus() string {
	if m.TotalRecordedToday <= 0 {
		return "No Records Today"
	}
	if m.AttendanceRate >= 90.0 {
		return "Healthy"
	}
	if m.AttendanceRate >= 75.0 {
		return "Moderate"
	}
	return "Needs Attention"
}

// TeacherOption represents an instructor available for class assignment.
type TeacherOption struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
}

// FullName returns the formatted teacher display name.
func (t *TeacherOption) FullName() string {
	full := strings.TrimSpace(strings.TrimSpace(t.FirstName) + " " + strings.TrimSpace(t.LastName))
	if full == "" {
		return t.UserID
	}
	return full
}

// AdminClassSection represents a scheduled class section managed in the Admin Dashboard.
type AdminClassSection struct {
	ID            string                       `json:"id"`
	Name          string                       `json:"name"`
	Subject       string                       `json:"subject"`
	RoomNumber    string                       `json:"room_number"`
	TeacherID     string                       `json:"teacher_id"`
	TeacherName   string                       `json:"teacher_name"`
	EnrolledCount int                          `json:"enrolled_count"`
	Students      []attendance.EnrolledStudent `json:"students"`
}

// EnrollStudentRequest is the request payload to enroll a student in a class.
type EnrollStudentRequest struct {
	StudentID string `json:"student_id"`
}

// AdminUserRecord represents a user account in the Admin User Directory.
type AdminUserRecord struct {
	ID               string   `json:"id"`
	FirstName        string   `json:"first_name"`
	LastName         string   `json:"last_name"`
	Email            string   `json:"email"`
	Role             string   `json:"role"`
	Birthday         string   `json:"birthday,omitempty"`
	Address          string   `json:"address,omitempty"`
	LinkedParentID   string   `json:"linked_parent_id,omitempty"`
	LinkedStudentIDs []string `json:"linked_student_ids,omitempty"`
}

// FullName returns the formatted full name for the directory user record.
func (u *AdminUserRecord) FullName() string {
	full := strings.TrimSpace(strings.TrimSpace(u.FirstName) + " " + strings.TrimSpace(u.LastName))
	if full == "" {
		return u.ID
	}
	return full
}

// MatchesFilter evaluates whether the user record matches a role filter and search query.
func (u *AdminUserRecord) MatchesFilter(roleFilter string, searchQuery string) bool {
	normalizedRoleFilter := strings.ToLower(strings.TrimSpace(roleFilter))
	if normalizedRoleFilter != "" && normalizedRoleFilter != "all" {
		if !strings.EqualFold(strings.TrimSpace(u.Role), normalizedRoleFilter) {
			return false
		}
	}

	q := strings.ToLower(strings.TrimSpace(searchQuery))
	if q == "" {
		return true
	}

	fullName := strings.ToLower(u.FullName())
	email := strings.ToLower(strings.TrimSpace(u.Email))
	id := strings.ToLower(strings.TrimSpace(u.ID))

	return strings.Contains(fullName, q) ||
		strings.Contains(email, q) ||
		strings.Contains(id, q)
}

// FilterUsers filters a slice of AdminUserRecord by role and search query using domain rules.
func FilterUsers(users []AdminUserRecord, roleFilter string, searchQuery string) []AdminUserRecord {
	filtered := make([]AdminUserRecord, 0, len(users))
	for _, u := range users {
		if u.MatchesFilter(roleFilter, searchQuery) {
			filtered = append(filtered, u)
		}
	}
	return filtered
}

// CreateUserRequest represents the payload for creating a new school user account.
type CreateUserRequest struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Password  string `json:"password"`
	Birthday  string `json:"birthday"`
	Address   string `json:"address"`
}

// Validate enforces domain business rules when an administrator creates a new user account.
func (r *CreateUserRequest) Validate() error {
	if strings.TrimSpace(r.FirstName) == "" || strings.TrimSpace(r.LastName) == "" {
		return ErrEmptyUserName
	}
	if strings.TrimSpace(r.Email) == "" {
		return ErrEmptyUserEmail
	}
	if len(strings.TrimSpace(r.Password)) < 6 {
		return ErrWeakPassword
	}

	candidateID := strings.TrimSpace(r.ID)
	if candidateID == "" {
		candidateID = "pending-id"
	}

	domainUser := auth.User{
		ID:        candidateID,
		FirstName: strings.TrimSpace(r.FirstName),
		LastName:  strings.TrimSpace(r.LastName),
		Email:     strings.TrimSpace(r.Email),
		Role:      strings.ToLower(strings.TrimSpace(r.Role)),
	}
	return domainUser.Validate()
}

// GenerateSchoolUserID generates a 6-digit ID for students or an 8-digit ID for staff/parents/admins.
func GenerateSchoolUserID(role string) string {
	if strings.EqualFold(strings.TrimSpace(role), "student") {
		n, err := rand.Int(rand.Reader, big.NewInt(900000))
		if err != nil {
			return "100001"
		}
		return fmt.Sprintf("%06d", n.Int64()+100000)
	}
	n, err := rand.Int(rand.Reader, big.NewInt(90000000))
	if err != nil {
		return "10000001"
	}
	return fmt.Sprintf("%08d", n.Int64()+10000000)
}

// HashUserPassword hashes a plain-text password using bcrypt.
func HashUserPassword(plainPassword string) (string, error) {
	if len(strings.TrimSpace(plainPassword)) < 6 {
		return "", ErrWeakPassword
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

// ParentStudentLinkRequest represents the payload for linking a parent account to a student account.
type ParentStudentLinkRequest struct {
	ParentID  string `json:"parent_id"`
	StudentID string `json:"student_id"`
}

// ValidateParentStudentLink enforces domain business rules when linking a parent to a student.
func ValidateParentStudentLink(parentID, parentRole, studentID, studentRole string, existingLinkedStudentIDs []string) error {
	pID := strings.TrimSpace(parentID)
	sID := strings.TrimSpace(studentID)
	if pID == "" || sID == "" {
		return ErrMissingParentOrStudentID
	}
	if !strings.EqualFold(strings.TrimSpace(parentRole), "parent") {
		return ErrInvalidParentRole
	}
	if !strings.EqualFold(strings.TrimSpace(studentRole), "student") {
		return ErrInvalidStudentRoleForLink
	}
	for _, existing := range existingLinkedStudentIDs {
		if strings.EqualFold(strings.TrimSpace(existing), sID) {
			return ErrDuplicateParentStudentLink
		}
	}
	return nil
}

// CalculateSchoolMetrics aggregates school-wide counts and computes today's attendance rate safely.
func CalculateSchoolMetrics(studentCount, teacherCount, classCount int, todayStatuses []string) SchoolMetrics {
	if studentCount < 0 {
		studentCount = 0
	}
	if teacherCount < 0 {
		teacherCount = 0
	}
	if classCount < 0 {
		classCount = 0
	}

	metrics := SchoolMetrics{
		TotalStudents: studentCount,
		TotalTeachers: teacherCount,
		ActiveClasses: classCount,
	}

	if teacherCount > 0 {
		metrics.StudentTeacherRatio = math.Round((float64(studentCount)/float64(teacherCount))*10) / 10
	}

	for _, raw := range todayStatuses {
		switch attendance.NormalizeAttendanceStatus(raw) {
		case "present":
			metrics.PresentToday++
			metrics.TotalRecordedToday++
		case "tardy":
			metrics.TardyToday++
			metrics.TotalRecordedToday++
		case "absent":
			metrics.AbsentToday++
			metrics.TotalRecordedToday++
		}
	}

	if metrics.TotalRecordedToday > 0 {
		attended := metrics.PresentToday + metrics.TardyToday
		metrics.AttendanceRate = math.Round((float64(attended)/float64(metrics.TotalRecordedToday))*1000) / 10
	}

	metrics.AttendanceStatus = metrics.EvaluateAttendanceStatus()
	return metrics
}

// Validate enforces domain business rules for creating or scheduling a class section.
func (c *AdminClassSection) Validate(assignedUserRole string) error {
	if strings.TrimSpace(c.Name) == "" {
		return ErrEmptyClassName
	}
	if strings.TrimSpace(c.Subject) == "" {
		return ErrEmptySubject
	}
	room := strings.TrimSpace(c.RoomNumber)
	if room == "" || !validRoomNumberPattern.MatchString(room) {
		return ErrInvalidRoomFormat
	}
	if strings.TrimSpace(c.TeacherID) == "" {
		return ErrMissingTeacher
	}
	if !strings.EqualFold(strings.TrimSpace(assignedUserRole), "teacher") {
		return ErrInvalidTeacherRole
	}
	return nil
}

// ValidateStudentEnrollment enforces domain rules for enrolling a student into a class roster.
func ValidateStudentEnrollment(studentID string, existingStudentIDs []string) error {
	target := strings.TrimSpace(studentID)
	if target == "" {
		return ErrEmptyStudentID
	}
	for _, existing := range existingStudentIDs {
		if strings.EqualFold(strings.TrimSpace(existing), target) {
			return ErrDuplicateEnrollment
		}
	}
	return nil
}
