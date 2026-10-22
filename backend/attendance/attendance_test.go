package attendance

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
)

func TestValidateAttendanceStatus(t *testing.T) {
	validStatuses := []string{"present", "absent", "tardy", "Present", "ABSENT", " Tardy "}
	for _, s := range validStatuses {
		if !ValidateAttendanceStatus(s) {
			t.Errorf("Expected status %q to be valid", s)
		}
	}

	invalidStatuses := []string{"", "late", "excused", "skipped", "unknown"}
	for _, s := range invalidStatuses {
		if ValidateAttendanceStatus(s) {
			t.Errorf("Expected status %q to be invalid", s)
		}
	}
}

func TestCalculateAttendanceSummary(t *testing.T) {
	records := []AttendanceRecord{
		{StudentID: "438813", Date: "2026-10-16", Status: "present"},
		{StudentID: "438813", Date: "2026-10-17", Status: "present"},
		{StudentID: "438813", Date: "2026-10-18", Status: "tardy"},
		{StudentID: "438813", Date: "2026-10-19", Status: "absent"},
		{StudentID: "438813", Date: "2026-10-20", Status: "present"},
	}

	summary := CalculateAttendanceSummary(records)
	if summary.TotalDays != 5 {
		t.Errorf("Expected TotalDays 5, got %d", summary.TotalDays)
	}
	if summary.PresentCount != 3 {
		t.Errorf("Expected PresentCount 3, got %d", summary.PresentCount)
	}
	if summary.TardyCount != 1 {
		t.Errorf("Expected TardyCount 1, got %d", summary.TardyCount)
	}
	if summary.AbsentCount != 1 {
		t.Errorf("Expected AbsentCount 1, got %d", summary.AbsentCount)
	}
	if summary.AttendanceRate != 80.0 {
		t.Errorf("Expected AttendanceRate 80.0, got %v", summary.AttendanceRate)
	}

	emptySummary := CalculateAttendanceSummary([]AttendanceRecord{})
	if emptySummary.TotalDays != 0 || emptySummary.AttendanceRate != 0.0 {
		t.Errorf("Expected zero summary for empty records, got %+v", emptySummary)
	}
}

func TestValidateSeatingPlan(t *testing.T) {
	validSeats := []SeatAssignment{
		{StudentID: "438813", Row: 0, Col: 0},
		{StudentID: "438814", Row: 0, Col: 1},
	}
	if err := ValidateSeatingPlan(validSeats, 4, 5); err != nil {
		t.Errorf("Expected valid seating plan to pass, got error: %v", err)
	}

	outOfBounds := []SeatAssignment{
		{StudentID: "438813", Row: 5, Col: 0},
	}
	if err := ValidateSeatingPlan(outOfBounds, 4, 5); err == nil {
		t.Errorf("Expected out-of-bounds seat to fail validation")
	}

	duplicateSeat := []SeatAssignment{
		{StudentID: "438813", Row: 1, Col: 2},
		{StudentID: "438814", Row: 1, Col: 2},
	}
	if err := ValidateSeatingPlan(duplicateSeat, 4, 5); err == nil {
		t.Errorf("Expected duplicate seat position to fail validation")
	}

	duplicateStudent := []SeatAssignment{
		{StudentID: "438813", Row: 0, Col: 0},
		{StudentID: "438813", Row: 1, Col: 1},
	}
	if err := ValidateSeatingPlan(duplicateStudent, 4, 5); err == nil {
		t.Errorf("Expected duplicate student assignment to fail validation")
	}
}

func setupTestApp() *fiber.App {
	app := fiber.New()
	SetupAttendanceAndPortalRoutes(app, nil)
	return app
}

func TestPostAttendance_Validation(t *testing.T) {
	app := setupTestApp()

	// Invalid status
	payload := BatchAttendanceRequest{
		Date: "2026-10-20",
		Records: []AttendanceRecord{
			{StudentID: "438813", Status: "invalid_status"},
		},
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("POST", "/api/classes/1/attendance", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for invalid status, got %d", resp.StatusCode)
	}
}

func TestPutSeating_Validation(t *testing.T) {
	app := setupTestApp()

	// Colliding seats
	payload := SeatingPlanRequest{
		Seats: []SeatAssignment{
			{StudentID: "438813", Row: 0, Col: 0},
			{StudentID: "438814", Row: 0, Col: 0},
		},
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("PUT", "/api/classes/1/seating", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for colliding seats, got %d", resp.StatusCode)
	}
}

func TestPostAnnouncement_Validation(t *testing.T) {
	app := setupTestApp()

	body := []byte(`{"title": "", "content": ""}`)
	req := httptest.NewRequest("POST", "/api/classes/1/announcements", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for empty announcement, got %d", resp.StatusCode)
	}
}
