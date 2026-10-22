package attendance

import "MTVSChool/assignments"

// EnrolledStudent represents a student enrolled in a class.
type EnrolledStudent struct {
	StudentID  string `json:"student_id"`
	InternalID string `json:"internal_id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Email      string `json:"email"`
}

// AttendanceRecord represents a single student's attendance status on a specific date.
type AttendanceRecord struct {
	ID          string `json:"id,omitempty"`
	ClassID     string `json:"class_id"`
	ClassName   string `json:"class_name,omitempty"`
	StudentID   string `json:"student_id"`
	StudentName string `json:"student_name,omitempty"`
	Date        string `json:"date"`
	Status      string `json:"status"` // "present", "absent", "tardy"
	Notes       string `json:"notes,omitempty"`
}

// BatchAttendanceRequest is the request payload for saving daily attendance for a class.
type BatchAttendanceRequest struct {
	Date    string             `json:"date"`
	Records []AttendanceRecord `json:"records"`
}

// DailyAttendanceLog groups a single day's attendance records and counts for a class.
type DailyAttendanceLog struct {
	Date         string             `json:"date"`
	PresentCount int                `json:"present_count"`
	AbsentCount  int                `json:"absent_count"`
	TardyCount   int                `json:"tardy_count"`
	Records      []AttendanceRecord `json:"records"`
}

// AttendanceSummary holds aggregate statistics for a student's attendance.
type AttendanceSummary struct {
	TotalDays      int     `json:"total_days"`
	PresentCount   int     `json:"present_count"`
	AbsentCount    int     `json:"absent_count"`
	TardyCount     int     `json:"tardy_count"`
	AttendanceRate float64 `json:"attendance_rate"`
}

// UserAttendanceResponse returns both summary metrics and chronological records.
type UserAttendanceResponse struct {
	Summary AttendanceSummary  `json:"summary"`
	Records []AttendanceRecord `json:"records"`
}

// SeatAssignment represents a student's desk coordinate in a classroom grid.
type SeatAssignment struct {
	ID          string `json:"id,omitempty"`
	ClassID     string `json:"class_id"`
	StudentID   string `json:"student_id"`
	StudentName string `json:"student_name,omitempty"`
	Row         int    `json:"row"`
	Col         int    `json:"col"`
}

// SeatingPlanRequest is the payload for saving a class seating chart.
type SeatingPlanRequest struct {
	MaxRows int              `json:"max_rows,omitempty"`
	MaxCols int              `json:"max_cols,omitempty"`
	Seats   []SeatAssignment `json:"seats"`
}

// Announcement represents a class announcement posted by a teacher.
type Announcement struct {
	ID        string `json:"id,omitempty"`
	ClassID   string `json:"class_id"`
	ClassName string `json:"class_name,omitempty"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Date      string `json:"date"`
}

// ChildGradeItem represents an assignment and its submission status/grade for the parent portal.
type ChildGradeItem struct {
	AssignmentID  string                          `json:"assignment_id"`
	ClassID       string                          `json:"class_id"`
	ClassName     string                          `json:"class_name"`
	Type          string                          `json:"type"`
	DueDate       string                          `json:"due_date"`
	Submitted     bool                            `json:"submitted"`
	SubmissionID  string                          `json:"submission_id,omitempty"`
	Grade         string                          `json:"grade"`
	DateSubmitted string                          `json:"date_submitted,omitempty"`
	Feedback      *assignments.SubmissionFeedback `json:"feedback,omitempty"`
}

// ChildClassInfo represents a class in which a parent's child is enrolled.
type ChildClassInfo struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Subject    string `json:"subject"`
	Teacher    string `json:"teacher"`
	RoomNumber string `json:"room_number"`
}

// LinkedChildOverview aggregates a linked child's grades, attendance summary, and announcements for a parent.
type LinkedChildOverview struct {
	StudentID         string             `json:"student_id"`
	InternalID        string             `json:"internal_id"`
	FirstName         string             `json:"first_name"`
	LastName          string             `json:"last_name"`
	Email             string             `json:"email"`
	Classes           []ChildClassInfo   `json:"classes"`
	Grades            []ChildGradeItem   `json:"grades"`
	AttendanceSummary AttendanceSummary  `json:"attendance_summary"`
	AttendanceRecords []AttendanceRecord `json:"attendance_records"`
	Announcements     []Announcement     `json:"announcements"`
}

// ParentOverviewResponse is returned by GET /api/parents/:parentId/overview.
type ParentOverviewResponse struct {
	ParentID string                `json:"parent_id"`
	Children []LinkedChildOverview `json:"children"`
}
