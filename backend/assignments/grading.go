package assignments

import (
	"fmt"
	"math"
	"strings"
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
		if exists && strings.EqualFold(strings.TrimSpace(studentAns), strings.TrimSpace(q.Answer)) {
			totalPoints += q.Points
		}
	}

	if needsManualGrading {
		return "Needs Manual Grading"
	}

	return fmt.Sprintf("%d", totalPoints)
}

// EvaluateSubmissionFeedback produces instant auto-grading feedback per question and overall score metrics.
func EvaluateSubmissionFeedback(assignment Assignment, submission Submission) SubmissionFeedback {
	isLate := !assignment.DueDate.IsZero() && submission.DateSubmitted.After(assignment.DueDate)
	needsManual := len(assignment.Questions) == 0 && assignment.File != ""

	studentAnswersMap := make(map[string]string)
	for _, sa := range submission.StudentAnswer {
		studentAnswersMap[sa.QuestionID] = sa.Answer
	}

	earnedPoints := 0
	totalPoints := 0
	questionFeedbacks := make([]QuestionFeedback, 0, len(assignment.Questions))

	for _, q := range assignment.Questions {
		totalPoints += q.Points
		studentAns := studentAnswersMap[q.ID]

		qf := QuestionFeedback{
			QuestionID:     q.ID,
			QuestionText:   q.Question,
			QuestionType:   q.Type,
			StudentAnswer:  studentAns,
			ExpectedAnswer: q.Answer,
			MaxPoints:      q.Points,
		}

		if q.Type == "free_form" {
			qf.NeedsReview = true
			needsManual = true
		} else {
			matched := studentAns != "" && strings.EqualFold(strings.TrimSpace(studentAns), strings.TrimSpace(q.Answer))
			qf.IsCorrect = matched
			if matched && !isLate {
				qf.AwardedPoints = q.Points
				earnedPoints += q.Points
			}
		}

		questionFeedbacks = append(questionFeedbacks, qf)
	}

	if isLate {
		earnedPoints = 0
	}

	percentage := 0.0
	if totalPoints > 0 {
		percentage = math.Round((float64(earnedPoints)/float64(totalPoints))*1000) / 10
	}

	summaryGrade := GradeAssignment(assignment, submission)

	return SubmissionFeedback{
		EarnedPoints:       earnedPoints,
		TotalPoints:        totalPoints,
		Percentage:         percentage,
		IsLate:             isLate,
		NeedsManualGrading: needsManual,
		SummaryGrade:       summaryGrade,
		Questions:          questionFeedbacks,
	}
}
