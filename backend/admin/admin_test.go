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
