package auth

import (
	"context"
	"os"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

func SetupAuthRoutes(app *fiber.App, conn *pgx.Conn) {
	app.Post("/api/login/", func(c fiber.Ctx) error {
		var req LoginRequest

		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request format",
			})
		}

		if req.Identifier == "" || req.Password == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Identifier and password are required",
			})
		}

		// Look up user by ID or Email
		query := `SELECT "ID", "Role", password_hash FROM public.users WHERE "ID" = $1 OR "Email" = $1 LIMIT 1`
		var dbID, dbRole, dbHash string
		err := conn.QueryRow(context.Background(), query, req.Identifier).Scan(&dbID, &dbRole, &dbHash)
		if err != nil {
			if err == pgx.ErrNoRows {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "Invalid credentials",
				})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Database lookup failed",
			})
		}

		// Verify hashed password
		if err := VerifyPassword(req.Password, dbHash); err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid credentials",
			})
		}

		// Generate JWT token
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Server configuration error (JWT_SECRET)",
			})
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"id":   dbID,
			"role": dbRole,
			"exp":  time.Now().Add(time.Hour * 24).Unix(), // 24 hours expiry
		})

		tokenString, err := token.SignedString([]byte(secret))
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to generate session token",
			})
		}

		return c.JSON(fiber.Map{
			"status": "success",
			"token":  tokenString,
			"user": fiber.Map{
				"id":   dbID,
				"role": dbRole,
			},
		})
	})
}

func VerifyPassword(userPassword, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(userPassword))
}
