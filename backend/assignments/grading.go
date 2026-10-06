package assignments

import (
	"fmt"
)

// GradeAssignment evaluates a submission against an assignment and returns the grade.
func GradeAssignment(assignment Assignment, submission Submission) string {
	// If submitted past the due date, grade is 0.
	if submission.DateSubmitted.After(assignment.DueDate) {
		return "0"
	}

	// If the assignment is file-based (no specific questions but a file is provided), it needs manual grading.
	if len(assignment.Questions) == 0 && assignment.File != "" {
		return "Needs Manual Grading"
	}

	totalPoints := 0
	needsManualGrading := false

	// Map student answers for quick lookup
	studentAnswersMap := make(map[string]string)
	for _, sa := range submission.StudentAnswer {
		studentAnswersMap[sa.QuestionID] = sa.Answer
	}

	for _, q := range assignment.Questions {
		if q.Type == "free_form" {
			needsManualGrading = true
			continue
		}

		studentAns, exists := studentAnswersMap[q.ID]
		if exists && studentAns == q.Answer {
			totalPoints += q.Points
		}
	}

	if needsManualGrading {
		return "Needs Manual Grading"
	}

	return fmt.Sprintf("%d", totalPoints)
}
