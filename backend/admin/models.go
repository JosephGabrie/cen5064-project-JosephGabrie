package admin

import (
	"errors"
	"math"
	"regexp"
	"strings"

	"MTVSChool/attendance"
)

var (
	ErrEmptyClassName       = errors.New("class name cannot be empty")
	ErrEmptySubject         = errors.New("class subject cannot be empty")
	ErrInvalidRoomFormat    = errors.New("room number must be 1-20 alphanumeric characters (e.g. 101, Room 204B, Lab-3)")
	ErrMissingTeacher       = errors.New("assigned teacher is required")
	ErrInvalidTeacherRole   = errors.New("assigned user must have the teacher role")
	ErrEmptyStudentID       = errors.New("student_id is required for enrollment")
	ErrDuplicateEnrollment  = errors.New("student is already enrolled in this class")
	validRoomNumberPattern  = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9\s\-]{0,19}$`)
)

// SchoolMetrics holds school-wide KPI metrics for the Admin Dashboard overview.
type SchoolMetrics struct {
	TotalStudents      int     `json:"total_students"`
	TotalTeachers      int     `json:"total_teachers"`
	ActiveClasses      int     `json:"active_classes"`
	AttendanceRate     float64 `json:"attendance_rate"`
	PresentToday       int     `json:"present_today"`
	AbsentToday        int     `json:"absent_today"`
	TardyToday         int     `json:"tardy_today"`
	TotalRecordedToday int     `json:"total_recorded_today"`
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
