package auth

import (
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidRole   = errors.New("invalid user role: must be student, teacher, admin, or parent")
	ErrEmptyUserID   = errors.New("user ID cannot be empty")
	ErrEmptyPassword = errors.New("password cannot be empty")
	ErrInvalidEmail  = errors.New("invalid email address format")
)

// User represents a domain user entity in the School Information System.
type User struct {
	ID           string `json:"id"`
	FirstName    string `json:"firstName"`
	LastName     string `json:"lastName"`
	Role         string `json:"role"`
	Email        string `json:"email"`
	PasswordHash string `json:"-"`
}

// Validate checks core domain business rules for a User.
func (u *User) Validate() error {
	if strings.TrimSpace(u.ID) == "" {
		return ErrEmptyUserID
	}
	role := strings.ToLower(strings.TrimSpace(u.Role))
	if role != "student" && role != "teacher" && role != "admin" && role != "parent" {
		return ErrInvalidRole
	}
	if u.Email != "" && !strings.Contains(u.Email, "@") {
		return ErrInvalidEmail
	}
	return nil
}

// HasRole checks whether the user matches a given role, case-insensitively.
func (u *User) HasRole(role string) bool {
	return strings.EqualFold(strings.TrimSpace(u.Role), strings.TrimSpace(role))
}

// FullName returns the display name for the user.
func (u *User) FullName() string {
	first := strings.TrimSpace(u.FirstName)
	last := strings.TrimSpace(u.LastName)
	if first == "" && last == "" {
		return u.ID
	}
	if first == "" {
		return last
	}
	if last == "" {
		return first
	}
	return first + " " + last
}

// VerifyPassword validates the plaintext password against the stored bcrypt hash.
func (u *User) VerifyPassword(password string) error {
	if strings.TrimSpace(password) == "" {
		return ErrEmptyPassword
	}
	return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
}
