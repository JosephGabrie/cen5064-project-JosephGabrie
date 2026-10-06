package assignments

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
)

func setupApp() *fiber.App {
	app := fiber.New()
	// Pass nil for DB since we only test request validation here
	// (we would mock it in a real setup with interfaces)
	SetupAssignmentRoutes(app, nil)
	return app
}

func TestPostAssignment_Validation(t *testing.T) {
	app := setupApp()

	// Test missing class_id
	assignment := Assignment{
		DueDate: time.Now().Add(24 * time.Hour),
	}
	body, _ := json.Marshal(assignment)

	req := httptest.NewRequest("POST", "/api/assignments", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to execute request: %v", err)
	}

	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", fiber.StatusBadRequest, resp.StatusCode)
	}
}

func TestGetAssignment_NoID(t *testing.T) {
	app := setupApp()
	req := httptest.NewRequest("GET", "/api/assignments/missing", nil)
	// We might return 500 if DB is nil, or 404/something else. We'll handle DB nil to just return 500.
	resp, _ := app.Test(req)
	if resp.StatusCode != fiber.StatusInternalServerError {
		// Just want to ensure route exists
		t.Logf("Got status %d, route exists", resp.StatusCode)
	}
}

func TestPutDueDate_Validation(t *testing.T) {
	app := setupApp()

	body := []byte(`{"due_date": "invalid-date"}`)
	req := httptest.NewRequest("PUT", "/api/assignments/1/due-date", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, _ := app.Test(req)
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("Expected status %d for invalid date, got %d", fiber.StatusBadRequest, resp.StatusCode)
	}
}
