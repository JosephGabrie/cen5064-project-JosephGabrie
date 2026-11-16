package api

import (
	"context"
	"errors"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrEmptyClassName = errors.New("class name cannot be empty")
	ErrEmptySubject   = errors.New("class subject cannot be empty")
)

type Class struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Teacher     string `json:"teacher"`
	Room_Number string `json:"room_Number"`
	Subject     string `json:"subject"`
}

// Validate checks core domain rules for a Class entity.
func (c *Class) Validate() error {
	if strings.TrimSpace(c.Name) == "" {
		return ErrEmptyClassName
	}
	if strings.TrimSpace(c.Subject) == "" {
		return ErrEmptySubject
	}
	return nil
}

// MatchesSubject checks if the class belongs to the specified subject (case-insensitive).
func (c *Class) MatchesSubject(subject string) bool {
	return strings.EqualFold(strings.TrimSpace(c.Subject), strings.TrimSpace(subject))
}

func GetUserClassess(app *fiber.App, conn *pgxpool.Pool) {
	app.Get(":userId/dashboard", func(c fiber.Ctx) error {
		userId := c.Params("userId")

		query := `SELECT c.id::text, c.class_name, u."FirstName" || ' ' || u."LastName" as teacher, c.room_number, c.subject 
		FROM class c
		JOIN teachers t ON c.teacher_id = t.id 
		JOIN users u ON t.user_id = u."ID"
		WHERE t.user_id = $1
		
		UNION 
		
		SELECT c.id::text, c.class_name, u."FirstName" || ' ' || u."LastName" as teacher, c.room_number, c.subject 
		FROM class c 
		JOIN teachers t ON c.teacher_id = t.id
		JOIN users u ON t.user_id = u."ID"
		JOIN enrollments e ON c.id = e.class_id 
		JOIN students s ON e.student_id = s.id 
		WHERE s.parent_id = $1 OR s.user_id = $1`

		rows, err := conn.Query(context.Background(), query, userId)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Database lookup failed: " + err.Error(),
			})
		}
		defer rows.Close()

		classes := []Class{}
		for rows.Next() {
			var class Class
			if err := rows.Scan(&class.ID, &class.Name, &class.Teacher, &class.Room_Number, &class.Subject); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to parse database data",
				})
			}
			classes = append(classes, class)
		}
		if err := rows.Err(); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Error iterating database rows: " + err.Error(),
			})
		}
		return c.JSON(classes)

	})

}
