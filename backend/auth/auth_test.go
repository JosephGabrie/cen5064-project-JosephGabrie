package auth_test

import (
	"testing"

	"MTVSChool/auth"
	"golang.org/x/crypto/bcrypt"
)

func TestUser_Validate(t *testing.T) {
	tests := []struct {
		name        string
		user        auth.User
		expectError bool
	}{
		{
			name: "Valid student",
			user: auth.User{
				ID:    "12345",
				Role:  "student",
				Email: "student@school.edu",
			},
			expectError: false,
		},
		{
			name: "Valid teacher mixed case role",
			user: auth.User{
				ID:    "98765",
				Role:  "Teacher",
				Email: "teacher@school.edu",
			},
			expectError: false,
		},
		{
			name: "Valid admin with whitespace",
			user: auth.User{
				ID:   "11111",
				Role: " admin ",
			},
			expectError: false,
		},
		{
			name: "Valid parent",
			user: auth.User{
				ID:   "22222",
				Role: "parent",
			},
			expectError: false,
		},
		{
			name: "Empty user ID fails",
			user: auth.User{
				ID:   "   ",
				Role: "student",
			},
			expectError: true,
		},
		{
			name: "Invalid role fails",
			user: auth.User{
				ID:   "12345",
				Role: "superadmin",
			},
			expectError: true,
		},
		{
			name: "Malformed email fails",
			user: auth.User{
				ID:    "12345",
				Role:  "student",
				Email: "notanemail",
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.user.Validate()
			if tt.expectError && err == nil {
				t.Fatalf("expected error, got nil")
			}
			if !tt.expectError && err != nil {
				t.Fatalf("expected no error, got: %v", err)
			}
		})
	}
}

func TestUser_HasRole(t *testing.T) {
	u := auth.User{ID: "100", Role: "Teacher"}

	if !u.HasRole("teacher") {
		t.Errorf("expected HasRole('teacher') to be true")
	}
	if !u.HasRole("TEACHER") {
		t.Errorf("expected HasRole('TEACHER') to be true")
	}
	if u.HasRole("student") {
		t.Errorf("expected HasRole('student') to be false")
	}
}

func TestUser_FullName(t *testing.T) {
	tests := []struct {
		name     string
		user     auth.User
		expected string
	}{
		{
			name:     "Both first and last present",
			user:     auth.User{ID: "1", FirstName: "Jane", LastName: "Doe"},
			expected: "Jane Doe",
		},
		{
			name:     "Only first name",
			user:     auth.User{ID: "2", FirstName: "Jane", LastName: ""},
			expected: "Jane",
		},
		{
			name:     "Only last name",
			user:     auth.User{ID: "3", FirstName: "", LastName: "Doe"},
			expected: "Doe",
		},
		{
			name:     "Neither name present falls back to ID",
			user:     auth.User{ID: "USER-99", FirstName: "", LastName: ""},
			expected: "USER-99",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.user.FullName(); got != tt.expected {
				t.Errorf("expected %q, got %q", tt.expected, got)
			}
		})
	}
}

func TestUser_VerifyPassword(t *testing.T) {
	password := "Secret123!"
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	u := auth.User{
		ID:           "438813",
		Role:         "student",
		PasswordHash: string(hashed),
	}

	// Correct password
	if err := u.VerifyPassword(password); err != nil {
		t.Errorf("expected valid password to verify, got error: %v", err)
	}

	// Incorrect password
	if err := u.VerifyPassword("WrongPassword"); err == nil {
		t.Errorf("expected invalid password to return error")
	}

	// Empty password
	if err := u.VerifyPassword("   "); err == nil {
		t.Errorf("expected empty password to return error")
	}
}

func TestVerifyPassword_Helper(t *testing.T) {
	password := "041210SS"
	hashed, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	if err := auth.VerifyPassword(password, string(hashed)); err != nil {
		t.Errorf("expected VerifyPassword helper to succeed, got: %v", err)
	}
	if err := auth.VerifyPassword("badpass", string(hashed)); err == nil {
		t.Errorf("expected VerifyPassword helper to fail on bad password")
	}
}
