package assignments

import (
	"fmt"
	"strings"
	"time"
)

// Question represents a single question in an assignment.
type Question struct {
	ID       string   `json:"id"`
	Question string   `json:"question"`
	Answer   string   `json:"answer"`
	Points   int      `json:"points"`
	Type     string   `json:"type"` // e.g., "multiple_choice", "free_form", "fill_in_the_blank", "true_false"
	Options  []string `json:"options,omitempty"` // For multiple choice questions
}

// Assignment represents a homework or quiz.
type Assignment struct {
	ID        string     `json:"id"`
	ClassID   string     `json:"class_id"`
	Questions []Question `json:"questions,omitempty"`
	File      string     `json:"file,omitempty"` // URL to supabase bucket
	DueDate   time.Time  `json:"due_date"`
}

// StudentAnswer represents a student's answer to a specific question.
type StudentAnswer struct {
	QuestionID string `json:"question_id"`
	Answer     string `json:"answer"`
}

// QuestionFeedback provides instant auto-grading details for a single question.
type QuestionFeedback struct {
	QuestionID     string `json:"question_id"`
	QuestionText   string `json:"question_text"`
	QuestionType   string `json:"question_type"`
	StudentAnswer  string `json:"student_answer"`
	ExpectedAnswer string `json:"expected_answer,omitempty"`
	IsCorrect      bool   `json:"is_correct"`
	NeedsReview    bool   `json:"needs_review"`
	AwardedPoints  int    `json:"awarded_points"`
	MaxPoints      int    `json:"max_points"`
}

// SubmissionFeedback encapsulates instant auto-grading summary and per-question breakdown.
type SubmissionFeedback struct {
	EarnedPoints       int                `json:"earned_points"`
	TotalPoints        int                `json:"total_points"`
	Percentage         float64            `json:"percentage"`
	IsLate             bool               `json:"is_late"`
	NeedsManualGrading bool               `json:"needs_manual_grading"`
	SummaryGrade       string             `json:"summary_grade"`
	Questions          []QuestionFeedback `json:"questions"`
}

// Submission represents a student's submission for an assignment.
type Submission struct {
	ID            string              `json:"id"`
	ClassID       string              `json:"class_id"`
	StudentID     string              `json:"student_id"`
	AssignmentID  string              `json:"assignment_id"`
	Grade         string              `json:"grade"`
	StudentAnswer []StudentAnswer     `json:"student_answer"`
	DateSubmitted time.Time           `json:"date_submitted"`
	Feedback      *SubmissionFeedback `json:"feedback,omitempty"`
}

// Validate checks domain constraints for an Assignment.
func (a *Assignment) Validate() error {
	if strings.TrimSpace(a.ClassID) == "" {
		return fmt.Errorf("class_id is required")
	}
	if a.DueDate.IsZero() {
		return fmt.Errorf("due_date is required")
	}
	for _, q := range a.Questions {
		if err := q.Validate(); err != nil {
			return err
		}
	}
	return nil
}

// IsLate checks if a submission timestamp occurs after the assignment due date.
func (a *Assignment) IsLate(submittedAt time.Time) bool {
	if a.DueDate.IsZero() {
		return false
	}
	return submittedAt.After(a.DueDate)
}

// TotalPoints calculates the cumulative maximum points for the assignment.
func (a *Assignment) TotalPoints() int {
	total := 0
	for _, q := range a.Questions {
		total += q.Points
	}
	return total
}

// GradeSubmission calculates the grade using domain rules.
func (a *Assignment) GradeSubmission(sub Submission) string {
	return GradeAssignment(*a, sub)
}

// EvaluateFeedback computes per-question feedback and summary score metrics.
func (a *Assignment) EvaluateFeedback(sub Submission) SubmissionFeedback {
	return EvaluateSubmissionFeedback(*a, sub)
}

// Validate checks domain constraints for a Question.
func (q *Question) Validate() error {
	if strings.TrimSpace(q.Question) == "" {
		return fmt.Errorf("question text cannot be empty")
	}
	if q.Points < 0 {
		return fmt.Errorf("question points cannot be negative")
	}
	validTypes := map[string]bool{
		"multiple_choice":   true,
		"free_form":         true,
		"fill_in_the_blank": true,
		"true_false":        true,
	}
	if !validTypes[q.Type] {
		return fmt.Errorf("invalid question type: %s", q.Type)
	}
	if q.Type == "multiple_choice" && len(q.Options) < 2 {
		return fmt.Errorf("multiple choice questions must have at least 2 options")
	}
	return nil
}

// EvaluateAnswer evaluates a student's answer against expected criteria.
func (q *Question) EvaluateAnswer(studentAns string) (isCorrect bool, awardedPoints int, needsReview bool) {
	if q.Type == "free_form" {
		return false, 0, true
	}
	s := strings.TrimSpace(studentAns)
	expected := strings.TrimSpace(q.Answer)
	if s != "" && strings.EqualFold(s, expected) {
		return true, q.Points, false
	}
	return false, 0, false
}

// Validate checks domain constraints for a Submission.
func (s *Submission) Validate() error {
	if strings.TrimSpace(s.StudentID) == "" {
		return fmt.Errorf("student_id is required")
	}
	if strings.TrimSpace(s.AssignmentID) == "" {
		return fmt.Errorf("assignment_id is required")
	}
	return nil
}

// GradeAssignment calculates the grade for this submission against the assignment.
func (s *Submission) GradeAssignment(a Assignment) string {
	return GradeAssignment(a, *s)
}

// GetAnswerForQuestion finds the student's answer for a given question ID.
func (s *Submission) GetAnswerForQuestion(questionID string) string {
	for _, ans := range s.StudentAnswer {
		if ans.QuestionID == questionID {
			return ans.Answer
		}
	}
	return ""
}

