package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"MTVSChool/api"
	"MTVSChool/auth"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func connect() (*pgx.Conn, error) {
	// Try to load .env from different possible working directories
	err := godotenv.Load("../.env")
	if err != nil {
		err = godotenv.Load("../../.env")
		if err != nil {
			log.Println("Warning: Could not load .env file from relative paths (it might already be in the environment)")
		}
	}

	connString := os.Getenv("SUPABASE_CONNECTION_STRING")
	if connString == "" {
		return nil, fmt.Errorf("SUPABASE_CONNECTION_STRING environment variable is not set")
	}

	conn, err := pgx.Connect(context.Background(), connString)
	if err != nil {
		return nil, err
	}

	return conn, nil
}

func main() {
	conn, err := connect()
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer conn.Close(context.Background())
	fmt.Println("Successfully connected to the database!")

	app := fiber.New()

	// Enable CORS for frontend requests
	// TODO Set up CORS to only work with frontend
	app.Use(cors.New())

	// Setup Authentication Routes
	auth.SetupAuthRoutes(app, conn)
	api.GetUserClassess(app, conn)
	app.Get("/", func(c fiber.Ctx) error {
		return c.SendString("Hello World")
	})
	app.Get("/users/:id", func(c fiber.Ctx) error {
		return c.SendString("User ID: " + c.Params("id"))
	})

	log.Fatal(app.Listen(":6769"))
}
