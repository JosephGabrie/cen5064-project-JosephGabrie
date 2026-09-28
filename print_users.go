package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load(".env")
	connString := os.Getenv("SUPABASE_CONNECTION_STRING")
	if connString == "" {
		log.Fatal("SUPABASE_CONNECTION_STRING environment variable is not set")
	}

	pool, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	rows, err := pool.Query(context.Background(), `SELECT "ID", "Role", "Email" FROM public.users`)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, role string
		var email *string
		rows.Scan(&id, &role, &email)
		if email != nil {
			fmt.Printf("ID: %s, Role: %s, Email: %s\n", id, role, *email)
		} else {
			fmt.Printf("ID: %s, Role: %s, Email: <nil>\n", id, role)
		}
	}
}
