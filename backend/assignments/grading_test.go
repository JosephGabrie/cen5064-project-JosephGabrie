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

func TestEvaluateSubmissionFeedback(t *testing.T) {
	futureDate := time.Now().Add(24 * time.Hour)
	pastDate := time.Now().Add(-24 * time.Hour)

	assignment := Assignment{
		ID:      "assign-1",
		ClassID: "1",
		DueDate: futureDate,
		Questions: []Question{
			{ID: "q1", Question: "2 + 2 = ?", Answer: "4", Points: 5, Type: "multiple_choice", Options: []string{"3", "4", "5"}},
			{ID: "q2", Question: "Water is H2O", Answer: "true", Points: 5, Type: "true_false"},
		},
	}

	sub := Submission{
		AssignmentID:  "assign-1",
		StudentID:     "438813",
		DateSubmitted: time.Now(),
		StudentAnswer: []StudentAnswer{
			{QuestionID: "q1", Answer: "4"},
			{QuestionID: "q2", Answer: "false"},
		},
	}

	feedback := EvaluateSubmissionFeedback(assignment, sub)
	if feedback.EarnedPoints != 5 {
		t.Errorf("Expected EarnedPoints 5, got %d", feedback.EarnedPoints)
	}
	if feedback.TotalPoints != 10 {
		t.Errorf("Expected TotalPoints 10, got %d", feedback.TotalPoints)
	}
	if feedback.Percentage != 50 {
		t.Errorf("Expected Percentage 50, got %v", feedback.Percentage)
	}
	if len(feedback.Questions) != 2 {
		t.Fatalf("Expected 2 question feedback items, got %d", len(feedback.Questions))
	}
	if !feedback.Questions[0].IsCorrect || feedback.Questions[0].AwardedPoints != 5 {
		t.Errorf("Expected question 1 to be correct with 5 points")
	}
	if feedback.Questions[1].IsCorrect || feedback.Questions[1].AwardedPoints != 0 || feedback.Questions[1].ExpectedAnswer != "true" {
		t.Errorf("Expected question 2 to be incorrect with expected answer 'true'")
	}

	// Late submission check
	lateAssignment := assignment
	lateAssignment.DueDate = pastDate
	lateFeedback := EvaluateSubmissionFeedback(lateAssignment, sub)
	if !lateFeedback.IsLate || lateFeedback.EarnedPoints != 0 {
		t.Errorf("Expected late submission to have IsLate=true and EarnedPoints=0")
	}
}

