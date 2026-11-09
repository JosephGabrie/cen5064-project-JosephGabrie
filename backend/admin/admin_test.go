package admin

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
)

func setupTestAdminApp() *fiber.App {
	app := fiber.New()
	SetupAdminRoutes(app, nil)
	return app
}

func TestCalculateSchoolMetrics(t *testing.T) {
	statuses := []string{"present", "Present", "tardy", "absent", "PRESENT"}
	metrics := CalculateSchoolMetrics(120, 14, 8, statuses)

	if metrics.TotalStudents != 120 {
		t.Errorf("expected TotalStudents 120, got %d", metrics.TotalStudents)
	}
	if metrics.TotalTeachers != 14 {
		t.Errorf("expected TotalTeachers 14, got %d", metrics.TotalTeachers)
	}
	if metrics.ActiveClasses != 8 {
		t.Errorf("expected ActiveClasses 8, got %d", metrics.ActiveClasses)
	}
	if metrics.PresentToday != 3 {
		t.Errorf("expected PresentToday 3, got %d", metrics.PresentToday)
	}
	if metrics.TardyToday != 1 {
		t.Errorf("expected TardyToday 1, got %d", metrics.TardyToday)
	}
	if metrics.AbsentToday != 1 {
		t.Errorf("expected AbsentToday 1, got %d", metrics.AbsentToday)
	}
	if metrics.TotalRecordedToday != 5 {
		t.Errorf("expected TotalRecordedToday 5, got %d", metrics.TotalRecordedToday)
	}
	if metrics.AttendanceRate != 80.0 {
		t.Errorf("expected AttendanceRate 80.0, got %v", metrics.AttendanceRate)
	}

	// Zero division safety check when no attendance records exist
	emptyMetrics := CalculateSchoolMetrics(-5, -2, 0, []string{})
	if emptyMetrics.TotalStudents != 0 || emptyMetrics.TotalTeachers != 0 || emptyMetrics.AttendanceRate != 0.0 {
		t.Errorf("expected zeroed metrics for empty/negative inputs, got %+v", emptyMetrics)
	}
}

func TestAdminClassSection_Validate(t *testing.T) {
	validClass := AdminClassSection{
		Name:       "Grade 6 Science",
		Subject:    "Science",
		RoomNumber: "Room 204B",
		TeacherID:  "31229834",
	}

	if err := validClass.Validate("teacher"); err != nil {
		t.Errorf("expected valid class section to pass validation, got: %v", err)
	}

	// Empty name
	missingName := validClass
	missingName.Name = "   "
	if err := missingName.Validate("teacher"); err != ErrEmptyClassName {
		t.Errorf("expected ErrEmptyClassName, got: %v", err)
	}

	// Empty subject
	missingSubject := validClass
	missingSubject.Subject = ""
	if err := missingSubject.Validate("teacher"); err != ErrEmptySubject {
		t.Errorf("expected ErrEmptySubject, got: %v", err)
	}

	// Invalid room number format
	invalidRoom := validClass
	invalidRoom.RoomNumber = "@@@"
	if err := invalidRoom.Validate("teacher"); err != ErrInvalidRoomFormat {
		t.Errorf("expected ErrInvalidRoomFormat, got: %v", err)
	}

	// Missing teacher ID
	missingTeacher := validClass
	missingTeacher.TeacherID = ""
	if err := missingTeacher.Validate("teacher"); err != ErrMissingTeacher {
		t.Errorf("expected ErrMissingTeacher, got: %v", err)
	}

	// Assigned user is not a teacher (e.g., student)
	if err := validClass.Validate("student"); err != ErrInvalidTeacherRole {
		t.Errorf("expected ErrInvalidTeacherRole when assigning student as teacher, got: %v", err)
	}
}

func TestValidateStudentEnrollment(t *testing.T) {
	existing := []string{"438813", "998877"}

	// Valid new student
	if err := ValidateStudentEnrollment("554433", existing); err != nil {
		t.Errorf("expected valid new enrollment to succeed, got: %v", err)
	}

	// Empty student ID
	if err := ValidateStudentEnrollment("   ", existing); err != ErrEmptyStudentID {
		t.Errorf("expected ErrEmptyStudentID, got: %v", err)
	}

	// Duplicate student enrollment guard
	if err := ValidateStudentEnrollment("438813", existing); err != ErrDuplicateEnrollment {
		t.Errorf("expected ErrDuplicateEnrollment for already enrolled student, got: %v", err)
	}
}

func TestAdminRoleMiddleware_RejectsNonAdmin(t *testing.T) {
	app := setupTestAdminApp()

	req := httptest.NewRequest("GET", "/api/admin/metrics", nil)
	req.Header.Set("X-User-Role", "student")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusForbidden {
		t.Errorf("expected 403 Forbidden for student role, got %d", resp.StatusCode)
	}
}

func TestPostAdminClass_Validation(t *testing.T) {
	app := setupTestAdminApp()

	// Missing subject and teacher_id should return 400 Bad Request
	payload := AdminClassSection{
		Name:       "Algebra I",
		Subject:    "",
		RoomNumber: "101",
		TeacherID:  "",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/api/admin/classes", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-Role", "admin")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid class payload, got %d", resp.StatusCode)
	}
}

func TestPostEnrollStudent_Validation(t *testing.T) {
	app := setupTestAdminApp()

	body := []byte(`{"student_id": ""}`)
	req := httptest.NewRequest("POST", "/api/admin/classes/1/enroll", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-Role", "admin")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for empty student_id, got %d", resp.StatusCode)
	}
}

func TestAdminUserRecord_MatchesFilter_And_FilterUsers(t *testing.T) {
	users := []AdminUserRecord{
		{ID: "438813", FirstName: "Sammy", LastName: "Student", Email: "sammy@school.edu", Role: "student"},
		{ID: "31229834", FirstName: "Timmy", LastName: "Teacher", Email: "timmy@school.edu", Role: "teacher"},
		{ID: "76633852", FirstName: "Patty", LastName: "Parent", Email: "patty@family.org", Role: "parent"},
		{ID: "31864322", FirstName: "Alice", LastName: "Admin", Email: "alice@school.edu", Role: "admin"},
	}

	// Filter by role only
	studentsOnly := FilterUsers(users, "student", "")
	if len(studentsOnly) != 1 || studentsOnly[0].ID != "438813" {
		t.Errorf("expected 1 student, got %d", len(studentsOnly))
	}

	// Filter by search query (case-insensitive name/email/ID)
	searchByEmail := FilterUsers(users, "all", "PATTY@FAMILY")
	if len(searchByEmail) != 1 || searchByEmail[0].ID != "76633852" {
		t.Errorf("expected Patty Parent by email search, got %v", searchByEmail)
	}

	searchByID := FilterUsers(users, "", "3122")
	if len(searchByID) != 1 || searchByID[0].FirstName != "Timmy" {
		t.Errorf("expected Timmy Teacher by ID search, got %v", searchByID)
	}

	// Combined role + search query mismatch
	mismatch := FilterUsers(users, "teacher", "Sammy")
	if len(mismatch) != 0 {
		t.Errorf("expected 0 results when filtering teacher with 'Sammy', got %d", len(mismatch))
	}
}

func TestCreateUserRequest_Validate(t *testing.T) {
	validReq := CreateUserRequest{
		FirstName: "Elena",
		LastName:  "Rivera",
		Email:     "elena.rivera@school.edu",
		Role:      "teacher",
		Password:  "Secret123!",
	}
	if err := validReq.Validate(); err != nil {
		t.Errorf("expected valid CreateUserRequest to pass, got %v", err)
	}

	missingName := validReq
	missingName.FirstName = "  "
	if err := missingName.Validate(); err != ErrEmptyUserName {
		t.Errorf("expected ErrEmptyUserName, got %v", err)
	}

	missingEmail := validReq
	missingEmail.Email = ""
	if err := missingEmail.Validate(); err != ErrEmptyUserEmail {
		t.Errorf("expected ErrEmptyUserEmail, got %v", err)
	}

	badEmail := validReq
	badEmail.Email = "not-an-email"
	if err := badEmail.Validate(); err == nil {
		t.Errorf("expected invalid email format error, got nil")
	}

	badRole := validReq
	badRole.Role = "principal"
	if err := badRole.Validate(); err == nil {
		t.Errorf("expected invalid role error, got nil")
	}

	weakPass := validReq
	weakPass.Password = "123"
	if err := weakPass.Validate(); err != ErrWeakPassword {
		t.Errorf("expected ErrWeakPassword, got %v", err)
	}
}

func TestValidateParentStudentLink(t *testing.T) {
	if err := ValidateParentStudentLink("76633852", "parent", "438813", "student", []string{"999999"}); err != nil {
		t.Errorf("expected valid parent-student link to succeed, got %v", err)
	}

	if err := ValidateParentStudentLink("", "parent", "438813", "student", nil); err != ErrMissingParentOrStudentID {
		t.Errorf("expected ErrMissingParentOrStudentID, got %v", err)
	}

	if err := ValidateParentStudentLink("31229834", "teacher", "438813", "student", nil); err != ErrInvalidParentRole {
		t.Errorf("expected ErrInvalidParentRole when parent user is a teacher, got %v", err)
	}

	if err := ValidateParentStudentLink("76633852", "parent", "31229834", "teacher", nil); err != ErrInvalidStudentRoleForLink {
		t.Errorf("expected ErrInvalidStudentRoleForLink when child user is a teacher, got %v", err)
	}

	if err := ValidateParentStudentLink("76633852", "parent", "438813", "student", []string{"438813"}); err != ErrDuplicateParentStudentLink {
		t.Errorf("expected ErrDuplicateParentStudentLink, got %v", err)
	}
}

func TestHashUserPassword(t *testing.T) {
	if _, err := HashUserPassword("short"); err != ErrWeakPassword {
		t.Errorf("expected ErrWeakPassword for short password, got %v", err)
	}

	hash, err := HashUserPassword("StrongPass123")
	if err != nil {
		t.Fatalf("unexpected error hashing password: %v", err)
	}
	if hash == "" || hash == "StrongPass123" {
		t.Errorf("expected bcrypt hash, got %q", hash)
	}
}

func TestPostAdminUser_Validation(t *testing.T) {
	app := setupTestAdminApp()

	invalidPayload := CreateUserRequest{
		FirstName: "Test",
		LastName:  "User",
		Email:     "invalid-email",
		Role:      "student",
		Password:  "password123",
	}
	body, _ := json.Marshal(invalidPayload)

	req := httptest.NewRequest("POST", "/api/admin/users", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-Role", "admin")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid user creation payload, got %d", resp.StatusCode)
	}
}

func TestPostParentStudentLink_Validation(t *testing.T) {
	app := setupTestAdminApp()

	body := []byte(`{"parent_id": "76633852", "student_id": ""}`)
	req := httptest.NewRequest("POST", "/api/admin/parent-links", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-Role", "admin")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for missing student_id in parent link, got %d", resp.StatusCode)
	}
}
