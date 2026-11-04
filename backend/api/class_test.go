package api_test

import (
	"testing"

	"MTVSChool/api"
)

func TestClass_Validate(t *testing.T) {
	tests := []struct {
		name        string
		class       api.Class
		expectError bool
	}{
		{
			name: "Valid class",
			class: api.Class{
				ID:      "c-1",
				Name:    "Grade 5 Math",
				Teacher: "Mr. Smith",
				Subject: "Mathematics",
			},
			expectError: false,
		},
		{
			name: "Missing name fails",
			class: api.Class{
				ID:      "c-2",
				Name:    "   ",
				Subject: "Science",
			},
			expectError: true,
		},
		{
			name: "Missing subject fails",
			class: api.Class{
				ID:      "c-3",
				Name:    "History 101",
				Subject: "",
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.class.Validate()
			if tt.expectError && err == nil {
				t.Fatalf("expected error, got nil")
			}
			if !tt.expectError && err != nil {
				t.Fatalf("expected no error, got: %v", err)
			}
		})
	}
}

func TestClass_MatchesSubject(t *testing.T) {
	c := api.Class{
		ID:      "c-10",
		Name:    "Science Lab",
		Subject: "Science",
	}

	if !c.MatchesSubject("science") {
		t.Errorf("expected MatchesSubject('science') to be true")
	}
	if !c.MatchesSubject("SCIENCE") {
		t.Errorf("expected MatchesSubject('SCIENCE') to be true")
	}
	if c.MatchesSubject("Math") {
		t.Errorf("expected MatchesSubject('Math') to be false")
	}
}
