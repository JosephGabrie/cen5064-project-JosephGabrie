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

func TestAssignment_DomainMethods(t *testing.T) {
	past := time.Now().Add(-1 * time.Hour)
	future := time.Now().Add(1 * time.Hour)

	validAssign := Assignment{
		ClassID: "class-123",
		DueDate: future,
		Questions: []Question{
			{ID: "q1", Question: "Capital of France?", Answer: "Paris", Points: 10, Type: "multiple_choice", Options: []string{"Paris", "Lyon"}},
			{ID: "q2", Question: "2+2=4", Answer: "true", Points: 5, Type: "true_false"},
		},
	}

	// Validate happy path
	if err := validAssign.Validate(); err != nil {
		t.Errorf("expected valid assignment to pass validation, got: %v", err)
	}

	// Validate missing class ID
	missingClass := validAssign
	missingClass.ClassID = ""
	if err := missingClass.Validate(); err == nil {
		t.Errorf("expected missing class_id to fail validation")
	}

	// Validate missing due date
	missingDueDate := validAssign
	missingDueDate.DueDate = time.Time{}
	if err := missingDueDate.Validate(); err == nil {
		t.Errorf("expected missing due_date to fail validation")
	}

	// Total points
	if pts := validAssign.TotalPoints(); pts != 15 {
		t.Errorf("expected TotalPoints 15, got %d", pts)
	}

	// IsLate check
	if validAssign.IsLate(past) {
		t.Errorf("expected IsLate(past) to be false when due date is in future")
	}
	if !validAssign.IsLate(time.Now().Add(2 * time.Hour)) {
		t.Errorf("expected IsLate to be true after due date")
	}

	// GradeSubmission & EvaluateFeedback methods
	sub := Submission{
		StudentID:     "student-1",
		AssignmentID:  "assign-1",
		DateSubmitted: time.Now(),
		StudentAnswer: []StudentAnswer{
			{QuestionID: "q1", Answer: "Paris"},
			{QuestionID: "q2", Answer: "true"},
		},
	}

	if grade := validAssign.GradeSubmission(sub); grade != "15" {
		t.Errorf("expected grade 15, got %s", grade)
	}
	fb := validAssign.EvaluateFeedback(sub)
	if fb.EarnedPoints != 15 || fb.Percentage != 100 {
		t.Errorf("expected 100%% feedback, got %+v", fb)
	}
}

func TestQuestion_DomainMethods(t *testing.T) {
	// Valid question
	qMC := Question{
		ID:       "q1",
		Question: "Which planet is closest to the sun?",
		Answer:   "Mercury",
		Points:   10,
		Type:     "multiple_choice",
		Options:  []string{"Mercury", "Venus", "Earth"},
	}
	if err := qMC.Validate(); err != nil {
		t.Errorf("expected valid question to pass, got: %v", err)
	}

	// Multiple choice with less than 2 options
	qMCInvalid := qMC
	qMCInvalid.Options = []string{"Mercury"}
	if err := qMCInvalid.Validate(); err == nil {
		t.Errorf("expected MC question with 1 option to fail validation")
	}

	// Negative points
	qNeg := qMC
	qNeg.Points = -5
	if err := qNeg.Validate(); err == nil {
		t.Errorf("expected negative points to fail validation")
	}

	// Empty question text
	qEmpty := qMC
	qEmpty.Question = "   "
	if err := qEmpty.Validate(); err == nil {
		t.Errorf("expected empty question text to fail validation")
	}

	// Invalid type
	qBadType := qMC
	qBadType.Type = "unknown_type"
	if err := qBadType.Validate(); err == nil {
		t.Errorf("expected invalid type to fail validation")
	}

	// EvaluateAnswer
	isCorr, pts, needsRev := qMC.EvaluateAnswer("Mercury")
	if !isCorr || pts != 10 || needsRev {
		t.Errorf("expected correct answer, got isCorr=%v pts=%d needsRev=%v", isCorr, pts, needsRev)
	}

	isCorr, pts, _ = qMC.EvaluateAnswer("Venus")
	if isCorr || pts != 0 {
		t.Errorf("expected wrong answer to award 0 points")
	}

	qFreeForm := Question{
		ID:       "q-essay",
		Question: "Describe photosynthesis",
		Points:   20,
		Type:     "free_form",
	}
	_, _, needsRev = qFreeForm.EvaluateAnswer("Plants make food")
	if !needsRev {
		t.Errorf("expected free_form question to require review")
	}
}

func TestSubmission_DomainMethods(t *testing.T) {
	validSub := Submission{
		StudentID:    "student-123",
		AssignmentID: "assign-456",
		StudentAnswer: []StudentAnswer{
			{QuestionID: "q1", Answer: "A"},
			{QuestionID: "q2", Answer: "B"},
		},
	}

	if err := validSub.Validate(); err != nil {
		t.Errorf("expected valid submission to pass validation, got: %v", err)
	}

	// Missing student ID
	missingStudent := validSub
	missingStudent.StudentID = ""
	if err := missingStudent.Validate(); err == nil {
		t.Errorf("expected missing student_id to fail validation")
	}

	// Missing assignment ID
	missingAssign := validSub
	missingAssign.AssignmentID = "  "
	if err := missingAssign.Validate(); err == nil {
		t.Errorf("expected missing assignment_id to fail validation")
	}

	// GetAnswerForQuestion
	if ans := validSub.GetAnswerForQuestion("q1"); ans != "A" {
		t.Errorf("expected answer 'A', got %q", ans)
	}
	if ans := validSub.GetAnswerForQuestion("q999"); ans != "" {
		t.Errorf("expected empty string for unknown question, got %q", ans)
	}

	// GradeAssignment method on submission
	a := Assignment{
		DueDate: time.Now().Add(1 * time.Hour),
		Questions: []Question{
			{ID: "q1", Answer: "A", Points: 10, Type: "multiple_choice"},
			{ID: "q2", Answer: "B", Points: 10, Type: "multiple_choice"},
		},
	}
	if grade := validSub.GradeAssignment(a); grade != "20" {
		t.Errorf("expected grade 20, got %s", grade)
	}
}


