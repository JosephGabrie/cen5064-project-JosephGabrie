package auth

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

func RequiredRoles(allowedRoles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		secret := []byte(os.Getenv("JWT_SECRET"))
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) { return secret, nil })
		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token claims"})

		}
		userRole := claims["role"].(string)
		roleAllowed := false

		for _, role := range allowedRoles {
			if role == userRole {
				roleAllowed = true
				break
			}
		}
		if !roleAllowed {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You don't have access to perform this action "})

		}
		c.Locals("userID", claims["id"])
		return c.Next()
	}
}
