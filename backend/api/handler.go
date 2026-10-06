package api

import (
	"context"
	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"
)

type Class struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Teacher     string `json:"teacher"`
	Room_Number string `json:"room_Number"`
	Subject     string `json:"subject"`
}

func GetUserClassess(app *fiber.App, conn *pgx.Conn) {
	app.Get(":userId/dashboard", func(c fiber.Ctx) error {
		userId := c.Params("userID")

		query := `SELECT c.id, c.name, c.teacher, c.room_number, c.subject FROM classes c
		JOIN teacher t ON c.teacher = t.id WHERE t.user_id = $1

		UNION 
		SELECT cid, c.name, c.teacher, c.room_number, c.subject FROM classes c 
		JOIN students s ON c.students = s.id 
		JOIN parents p on s.Parent = p.id 
		WHERE p.id = $1`

		rows, err := conn.Query(context.Background(), query, userId)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Database lookup failed",
			})
		}
		defer rows.Close()

		var classes []Class
		for rows.Next() {
			var class Class
			if err := rows.Scan(&class.ID, &class.Name, &class.Teacher, &class.Room_Number, &class.Subject); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to parse database data",
				})
			}
			classes = append(classes, class)
		}
		return c.JSON(classes)

	})

}
