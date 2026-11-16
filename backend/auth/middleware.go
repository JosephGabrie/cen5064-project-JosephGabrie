package auth

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

// RequiredLogin checks if the user has a valid JWT, but doesn't restrict by role
func RequiredLogin() fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
		}
		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Server configuration error (JWT_SECRET)"})
		}
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token claims"})
		}

		c.Locals("userID", claims["id"])
		c.Locals("userRole", claims["role"])
		return c.Next()
	}
}

// RequiredRoles checks if the user has a valid JWT AND matches the specific roles
func RequiredRoles(allowedRoles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
		}
		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Server configuration error (JWT_SECRET)"})
		}
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token claims"})
		}

		userRole, _ := claims["role"].(string)
		roleAllowed := false

		for _, role := range allowedRoles {
			if strings.EqualFold(strings.TrimSpace(role), strings.TrimSpace(userRole)) {
				roleAllowed = true
				break
			}
		}
		if !roleAllowed {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You don't have access to perform this action"})
		}

		c.Locals("userID", claims["id"])
		c.Locals("userRole", userRole)
		return c.Next()
	}
}
