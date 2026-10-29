package attendance

import (
	"fmt"
	"math"
	"strings"
)

// NormalizeAttendanceStatus trims and lowercases an attendance status string.
func NormalizeAttendanceStatus(status string) string {
	return strings.ToLower(strings.TrimSpace(status))
}

// ValidateAttendanceStatus checks whether a status is one of "present", "absent", or "tardy".
func ValidateAttendanceStatus(status string) bool {
	s := NormalizeAttendanceStatus(status)
	return s == "present" || s == "absent" || s == "tardy"
}

// CalculateAttendanceSummary computes aggregate counts and attendance percentage from daily records.
func CalculateAttendanceSummary(records []AttendanceRecord) AttendanceSummary {
	summary := AttendanceSummary{
		TotalDays: len(records),
	}
	if len(records) == 0 {
		return summary
	}

	for _, r := range records {
		switch NormalizeAttendanceStatus(r.Status) {
		case "present":
			summary.PresentCount++
		case "tardy":
			summary.TardyCount++
		case "absent":
			summary.AbsentCount++
		}
	}

	attended := summary.PresentCount + summary.TardyCount
	summary.AttendanceRate = math.Round((float64(attended)/float64(summary.TotalDays))*1000) / 10
	return summary
}

// ValidateSeatingPlan ensures all seats are within grid bounds and have no seat or student collisions.
func ValidateSeatingPlan(seats []SeatAssignment, maxRows, maxCols int) error {
	if maxRows <= 0 {
		maxRows = 6
	}
	if maxCols <= 0 {
		maxCols = 8
	}

	occupiedCoords := make(map[string]string)
	assignedStudents := make(map[string]bool)

	for _, seat := range seats {
		studentID := strings.TrimSpace(seat.StudentID)
		if studentID == "" {
			return fmt.Errorf("student_id is required for seat assignment")
		}
		if seat.Row < 0 || seat.Row >= maxRows || seat.Col < 0 || seat.Col >= maxCols {
			return fmt.Errorf("seat (%d, %d) is out of classroom grid bounds (%dx%d)", seat.Row, seat.Col, maxRows, maxCols)
		}

		coordKey := fmt.Sprintf("%d:%d", seat.Row, seat.Col)
		if existingStudent, occupied := occupiedCoords[coordKey]; occupied {
			return fmt.Errorf("seat (%d, %d) is already assigned to student %s", seat.Row, seat.Col, existingStudent)
		}
		if assignedStudents[studentID] {
			return fmt.Errorf("student %s is assigned to multiple seats", studentID)
		}

		occupiedCoords[coordKey] = studentID
		assignedStudents[studentID] = true
	}

	return nil
}

// GroupAttendanceByDate organizes flat attendance records (assumed ordered by date DESC) into DailyAttendanceLogs.
func GroupAttendanceByDate(records []AttendanceRecord) []DailyAttendanceLog {
	logsByDate := make(map[string]*DailyAttendanceLog)
	orderedDates := []string{}

	for _, r := range records {
		logEntry, exists := logsByDate[r.Date]
		if !exists {
			logEntry = &DailyAttendanceLog{
				Date:    r.Date,
				Records: []AttendanceRecord{},
			}
			logsByDate[r.Date] = logEntry
			orderedDates = append(orderedDates, r.Date)
		}

		switch NormalizeAttendanceStatus(r.Status) {
		case "present":
			logEntry.PresentCount++
		case "absent":
			logEntry.AbsentCount++
		case "tardy":
			logEntry.TardyCount++
		}
		logEntry.Records = append(logEntry.Records, r)
	}

	result := make([]DailyAttendanceLog, 0, len(orderedDates))
	for _, d := range orderedDates {
		result = append(result, *logsByDate[d])
	}
	return result
}
