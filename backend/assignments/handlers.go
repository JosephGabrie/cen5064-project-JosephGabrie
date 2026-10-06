package assignments

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Assignment struct {
	ID      int       `json:"id,omitempty"`
	ClassID string    `json:"class_id"`
	DueDate time.Time `json:"due_date"`
}

func SetupAssignmentRoutes(app *fiber.App, db *pgxpool.Pool) {
	api := app.Group("/api/assignments")

	api.Post("/", func(c fiber.Ctx) error {
		var assignment Assignment
		if err := c.Bind().JSON(&assignment); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		if assignment.ClassID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "class_id is required"})
		}
		return c.SendStatus(fiber.StatusCreated)
	})

	api.Get("/:id", func(c fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "db is nil"})
		}
		return c.SendStatus(fiber.StatusOK)
	})

	api.Put("/:id/due-date", func(c fiber.Ctx) error {
		type DueDateUpdate struct {
			DueDate time.Time `json:"due_date"`
		}
		var update DueDateUpdate
		if err := c.Bind().JSON(&update); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid date"})
		}
		return c.SendStatus(fiber.StatusOK)
	})
}
