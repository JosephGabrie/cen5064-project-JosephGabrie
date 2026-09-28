package assignments

import (
	"testing"
	"time"
)

func TestGradeAssignment(t *testing.T) {
	pastDate := time.Now().Add(-24 * time.Hour)
	futureDate := time.Now().Add(24 * time.Hour)

	tests := []struct {
		name          string
		assignment    Assignment
		submission    Submission
		expectedGrade string
	}{
		{
			name: "Late submission should receive 0",
			assignment: Assignment{
				DueDate: pastDate,
				Questions: []Question{
					{ID: "q1", Answer: "A", Points: 10, Type: "multiple_choice"},
				},
			},
			submission: Submission{
				DateSubmitted: time.Now(),
				StudentAnswer: []StudentAnswer{
					{QuestionID: "q1", Answer: "A"},
				},
			},
			expectedGrade: "0",
		},
		{
			name: "All correct answers",
			assignment: Assignment{
				DueDate: futureDate,
				Questions: []Question{
					{ID: "q1", Answer: "A", Points: 10, Type: "multiple_choice"},
					{ID: "q2", Answer: "B", Points: 20, Type: "multiple_choice"},
				},
			},
			submission: Submission{
				DateSubmitted: time.Now(),
				StudentAnswer: []StudentAnswer{
					{QuestionID: "q1", Answer: "A"},
					{QuestionID: "q2", Answer: "B"},
				},
			},
			expectedGrade: "30",
		},
		{
			name: "Partial correct answers",
			assignment: Assignment{
				DueDate: futureDate,
				Questions: []Question{
					{ID: "q1", Answer: "A", Points: 10, Type: "multiple_choice"},
					{ID: "q2", Answer: "B", Points: 20, Type: "multiple_choice"},
				},
			},
			submission: Submission{
				DateSubmitted: time.Now(),
				StudentAnswer: []StudentAnswer{
					{QuestionID: "q1", Answer: "A"},
					{QuestionID: "q2", Answer: "C"},
				},
			},
			expectedGrade: "10",
		},
		{
			name: "Free form question needs manual grading",
			assignment: Assignment{
				DueDate: futureDate,
				Questions: []Question{
					{ID: "q1", Answer: "", Points: 10, Type: "free_form"},
				},
			},
			submission: Submission{
				DateSubmitted: time.Now(),
				StudentAnswer: []StudentAnswer{
					{QuestionID: "q1", Answer: "This is an essay"},
				},
			},
			expectedGrade: "Needs Manual Grading",
		},
		{
			name: "File submission needs manual grading",
			assignment: Assignment{
				DueDate: futureDate,
				File:    "https://supabase.com/file.pdf",
			},
			submission: Submission{
				DateSubmitted: time.Now(),
				StudentAnswer: []StudentAnswer{},
			},
			expectedGrade: "Needs Manual Grading",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			grade := GradeAssignment(tt.assignment, tt.submission)
			if grade != tt.expectedGrade {
				t.Errorf("GradeAssignment() = %v, want %v", grade, tt.expectedGrade)
			}
		})
	}
}
