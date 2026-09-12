package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	FirstName string `json:"FirstName"`
	LastName  string `json:"LastName"`
	Birthday  string `json:"Birthday"`
	Address   string `json:"Address"`
	Role      string `json:"Role"`
	Email     string `json:"Email,omitempty"` // Added optional Email
}

func generateUserID(user User) string {
	// student gets a 6 digit ID, others get an 8 digit ID
	if user.Role == "student" {
		n, _ := rand.Int(rand.Reader, big.NewInt(900000))
		return fmt.Sprintf("%06d", n.Int64()+100000)
	}

	// 8 digit ID for non-students
	n, _ := rand.Int(rand.Reader, big.NewInt(90000000))
	return fmt.Sprintf("%08d", n.Int64()+10000000)
}

func generatePassword(user User) string {
	password := user.Birthday + user.FirstName[:1] + user.LastName[:1]
	hashPass, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	return string(hashPass)
}

func createUser(db *sql.DB, u User, hashPass string, userID string) error {
	// Treat empty string as NULL for the Email column
	var email *string
	if u.Email != "" {
		email = &u.Email
	}

	// Updated table name to "users", added "ID" and "Email" columns
	query := `INSERT INTO users ("ID", "FirstName", "LastName", "Birthday", "Address", "Role", "Email", password_hash)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	RETURNING "ID";`

	var returnedID string
	err := db.QueryRow(query, userID, u.FirstName, u.LastName, u.Birthday, u.Address, u.Role, email, hashPass).Scan(&returnedID)
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}
	fmt.Printf("Successfully created user with ID: %s\n", returnedID)
	return nil
}

func main() {
	// 1. Load Environment variables to get DB connection string
	err := godotenv.Load("../.env")
	if err != nil {
		err = godotenv.Load("../../.env") // Fallback if run from a different directory
		if err != nil {
			log.Println("Warning: Could not load .env file. Relying on existing environment variables.")
		}
	}
	connString := os.Getenv("SUPABASE_CONNECTION_STRING")
	if connString == "" {
		log.Fatal("SUPABASE_CONNECTION_STRING environment variable is not set")
	}
	// 2. Connect to the database using pgx/v5 stdlib wrapper
	db, err := sql.Open("pgx", connString)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()
	// 3. Open and parse users.json
	jsonFile, err := os.Open("../../users.json")
	if err != nil {
		jsonFile, err = os.Open("users.json") // fallback if run from the parent directory
		if err != nil {
			log.Fatal("Error opening users.json: ", err)
		}
	}

	fmt.Println("Successfully Opened users.json")
	defer jsonFile.Close()
	byteValue, _ := io.ReadAll(jsonFile)
	var users []User
	if err := json.Unmarshal(byteValue, &users); err != nil {
		log.Fatal("Failed to parse users.json: ", err)
	}
	// 4. Iterate over users, hash passwords, and create them in DB
	for _, u := range users {
		fmt.Printf("Processing user: %s %s...\n", u.FirstName, u.LastName)
		userID := generateUserID(u)
		hashPass := generatePassword(u)
		err := createUser(db, u, hashPass, userID)
		if err != nil {
			fmt.Println("Error:", err)
		}
	}
	fmt.Println("Done generating users!")
}
