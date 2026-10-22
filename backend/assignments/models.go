package assignments

import (
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
