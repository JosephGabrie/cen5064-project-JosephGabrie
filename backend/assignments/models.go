package assignments

import (
	"time"
)

// Question represents a single question in an assignment.
type Question struct {
	ID       string `json:"id"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
	Points   int    `json:"points"`
	Type     string `json:"type"` // e.g., "multiple_choice", "free_form", "fill_in_the_blank", "true_false"
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

// Submission represents a student's submission for an assignment.
type Submission struct {
	ID            string          `json:"id"`
	ClassID       string          `json:"class_id"`
	StudentID     string          `json:"student_id"`
	AssignmentID  string          `json:"assignment_id"`
	Grade         string          `json:"grade"`
	StudentAnswer []StudentAnswer `json:"student_answer"`
	DateSubmitted time.Time       `json:"date_submitted"`
}
