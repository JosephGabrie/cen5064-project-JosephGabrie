package assignments

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DueDateUpdateRequest is used for PutDueDate
type DueDateUpdateRequest struct {
	DueDate time.Time `json:"due_date"`
}

// SetupAssignmentRoutes initializes the assignment routes
func SetupAssignmentRoutes(app *fiber.App, conn *pgxpool.Pool) {
	group := app.Group("/api/assignments")
	group.Post("/", postAssignment(conn))
	group.Get("/:id", getAssignment(conn))
	group.Put("/:id/due-date", putDueDate(conn))

	subGroup := app.Group("/api/submissions")
	subGroup.Post("/", postSubmission(conn))
	subGroup.Get("/:id", getSubmission(conn))
}

func postAssignment(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		var req Assignment
		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
		}
		if req.ClassID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "class_id is required"})
		}
		if req.DueDate.IsZero() {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "due_date is required"})
		}

		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		// Insert into db
		query := `INSERT INTO public.assignments (id, class_id, questions, file, due_date) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id`
		var newID string
		err := conn.QueryRow(context.Background(), query, req.ClassID, req.Questions, req.File, req.DueDate).Scan(&newID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		req.ID = newID
		return c.Status(fiber.StatusCreated).JSON(req)
	}
}

func getAssignment(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		id := c.Params("id")
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `SELECT id, class_id, questions, file, due_date FROM public.assignments WHERE id = $1`
		var a Assignment
		err := conn.QueryRow(context.Background(), query, id).Scan(&a.ID, &a.ClassID, &a.Questions, &a.File, &a.DueDate)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Assignment not found"})
		}
		return c.JSON(a)
	}
}

func putDueDate(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		id := c.Params("id")
		var req DueDateUpdateRequest
		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format"})
		}
		if req.DueDate.IsZero() {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "due_date is required"})
		}

		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `UPDATE public.assignments SET due_date = $1 WHERE id = $2`
		tag, err := conn.Exec(context.Background(), query, req.DueDate, id)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		if tag.RowsAffected() == 0 {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Assignment not found"})
		}
		return c.JSON(fiber.Map{"status": "success", "due_date": req.DueDate})
	}
}

func postSubmission(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		var req Submission
		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
		}
		req.DateSubmitted = time.Now()

		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		// Fetch assignment to grade
		queryAssign := `SELECT id, class_id, questions, file, due_date FROM public.assignments WHERE id = $1`
		var a Assignment
		err := conn.QueryRow(context.Background(), queryAssign, req.AssignmentID).Scan(&a.ID, &a.ClassID, &a.Questions, &a.File, &a.DueDate)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Assignment not found"})
		}

		req.Grade = GradeAssignment(a, req)

		// Insert submission
		querySub := `INSERT INTO public.submissions (id, class_id, student_id, assignment_id, grade, student_answer, date_submitted) 
			VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) RETURNING id`
		var newID string
		err = conn.QueryRow(context.Background(), querySub, req.ClassID, req.StudentID, req.AssignmentID, req.Grade, req.StudentAnswer, req.DateSubmitted).Scan(&newID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		req.ID = newID
		return c.Status(fiber.StatusCreated).JSON(req)
	}
}

func getSubmission(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		id := c.Params("id")
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `SELECT id, class_id, student_id, assignment_id, grade, student_answer, date_submitted FROM public.submissions WHERE id = $1`
		var s Submission
		err := conn.QueryRow(context.Background(), query, id).Scan(&s.ID, &s.ClassID, &s.StudentID, &s.AssignmentID, &s.Grade, &s.StudentAnswer, &s.DateSubmitted)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Submission not found"})
		}
		return c.JSON(s)
	}
}
