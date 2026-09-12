package auth

import (
	"github.com/gofiber/fiber/v3"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	UserName string `json:"username"`
	Password string `json:"password"`
}

func SetupAuthRoutes(app *fiber.App) {
	app.Post("/api/login/", func(c fiber.Ctx) error {
		var req LoginRequest

		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request format",
			})
		}
		if req.UserName == "john" && req.Password == "secret" {
			return c.JSON(fiber.Map{"status": "success", "token": "your-auth-token"})
		}
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	})
}

func VerifyPassword(userPassword, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(userPassword))
}
