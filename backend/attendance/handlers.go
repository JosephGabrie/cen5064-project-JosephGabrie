package attendance

import (
	"context"
	"strings"
	"time"

	"MTVSChool/assignments"
	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SetupAttendanceAndPortalRoutes registers seating, attendance, announcement, and parent portal routes.
func SetupAttendanceAndPortalRoutes(app *fiber.App, conn *pgxpool.Pool) {
	// Class roster & seating arrangement
	app.Get("/api/classes/:classId/students", getClassStudents(conn))
	app.Get("/api/classes/:classId/seating", getClassSeating(conn))
	app.Put("/api/classes/:classId/seating", putClassSeating(conn))

	// Attendance storage & daily logs
	app.Post("/api/classes/:classId/attendance", postClassAttendance(conn))
	app.Get("/api/classes/:classId/attendance", getClassAttendance(conn))
	app.Get("/api/classes/:classId/attendance/logs", getClassAttendanceLogs(conn))
	app.Get("/api/users/:userId/attendance", getUserAttendance(conn))

	// Class & User Announcements
	app.Get("/api/classes/:classId/announcements", getClassAnnouncements(conn))
	app.Post("/api/classes/:classId/announcements", postClassAnnouncement(conn))
	app.Get("/api/users/:userId/announcements", getUserAnnouncements(conn))

	// Parent Portal Overview
	app.Get("/api/parents/:parentId/overview", getParentOverview(conn))
}

func getClassStudents(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		classId := c.Params("classId")
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `
			SELECT u."ID"::text, s.id::text, COALESCE(u."FirstName", ''), COALESCE(u."LastName", ''), COALESCE(u."Email", '')
			FROM public.enrollments e
			JOIN public.students s ON e.student_id = s.id
			JOIN public.users u ON s.user_id = u."ID"
			WHERE e.class_id::text = $1
			ORDER BY u."LastName" ASC, u."FirstName" ASC
		`
		rows, err := conn.Query(context.Background(), query, classId)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database lookup failed: " + err.Error()})
		}
		defer rows.Close()

		students := []EnrolledStudent{}
		for rows.Next() {
			var st EnrolledStudent
			if err := rows.Scan(&st.StudentID, &st.InternalID, &st.FirstName, &st.LastName, &st.Email); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to scan student row"})
			}
			students = append(students, st)
		}
		return c.JSON(students)
	}
}

func getClassSeating(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		classId := c.Params("classId")
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `
			SELECT sa.id::text, sa.class_id::text, COALESCE(s.user_id::text, sa.student_id::text),
			       COALESCE(NULLIF(TRIM(COALESCE(u."FirstName", '') || ' ' || COALESCE(u."LastName", '')), ''), 'Student'),
			       sa.row, sa.col
			FROM public.seating_assignments sa
			LEFT JOIN public.students s ON sa.student_id = s.user_id OR sa.student_id = s.id
			LEFT JOIN public.users u ON u."ID" = COALESCE(s.user_id, sa.student_id)
			WHERE sa.class_id::text = $1
			ORDER BY sa.row ASC, sa.col ASC
		`
		rows, err := conn.Query(context.Background(), query, classId)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database lookup failed: " + err.Error()})
		}
		defer rows.Close()

		seats := []SeatAssignment{}
		for rows.Next() {
			var seat SeatAssignment
			if err := rows.Scan(&seat.ID, &seat.ClassID, &seat.StudentID, &seat.StudentName, &seat.Row, &seat.Col); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to scan seating row"})
			}
			seats = append(seats, seat)
		}
		return c.JSON(seats)
	}
}

func putClassSeating(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		classId := c.Params("classId")
		var req SeatingPlanRequest
		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
		}

		if err := ValidateSeatingPlan(req.Seats, req.MaxRows, req.MaxCols); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		tx, err := conn.Begin(ctx)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to start transaction"})
		}
		defer tx.Rollback(ctx)

		_, err = tx.Exec(ctx, `DELETE FROM public.seating_assignments WHERE class_id = $1::bigint`, classId)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to clear existing seating: " + err.Error()})
		}

		for i := range req.Seats {
			req.Seats[i].ClassID = classId
			_, err = tx.Exec(ctx,
				`INSERT INTO public.seating_assignments (class_id, student_id, row, col) VALUES ($1::bigint, $2::bigint, $3, $4)`,
				classId, req.Seats[i].StudentID, req.Seats[i].Row, req.Seats[i].Col,
			)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to insert seat assignment: " + err.Error()})
			}
		}

		if err := tx.Commit(ctx); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to commit seating arrangement"})
		}

		return c.JSON(fiber.Map{
			"status": "success",
			"seats":  req.Seats,
		})
	}
}

func postClassAttendance(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		classId := c.Params("classId")
		var req BatchAttendanceRequest
		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
		}

		dateStr := strings.TrimSpace(req.Date)
		if dateStr == "" {
			dateStr = time.Now().Format("2006-01-02")
		}
		if _, err := time.Parse("2006-01-02", dateStr); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format, expected YYYY-MM-DD"})
		}
		if len(req.Records) == 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "At least one attendance record is required"})
		}

		for i, rec := range req.Records {
			if strings.TrimSpace(rec.StudentID) == "" {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "student_id is required for all attendance records"})
			}
			if !ValidateAttendanceStatus(rec.Status) {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid attendance status: must be present, absent, or tardy"})
			}
			req.Records[i].Status = NormalizeAttendanceStatus(rec.Status)
			req.Records[i].ClassID = classId
			req.Records[i].Date = dateStr
		}

		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		tx, err := conn.Begin(ctx)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to start transaction"})
		}
		defer tx.Rollback(ctx)

		upsertSQL := `
			INSERT INTO public.attendance (class_id, student_id, date, status, notes, updated_at)
			VALUES ($1, $2, $3::date, $4, $5, now())
			ON CONFLICT (class_id, student_id, date)
			DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = now()
			RETURNING id::text
		`
		for i := range req.Records {
			var recID string
			err := tx.QueryRow(ctx, upsertSQL,
				classId,
				req.Records[i].StudentID,
				dateStr,
				req.Records[i].Status,
				req.Records[i].Notes,
			).Scan(&recID)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save attendance: " + err.Error()})
			}
			req.Records[i].ID = recID
		}

		if err := tx.Commit(ctx); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to commit attendance"})
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"status":  "success",
			"date":    dateStr,
			"records": req.Records,
		})
	}
}

func getClassAttendance(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		classId := c.Params("classId")
		dateFilter := strings.TrimSpace(c.Query("date"))
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `
			SELECT a.id::text, a.class_id, COALESCE(c.class_name, ''), a.student_id,
			       COALESCE(NULLIF(TRIM(COALESCE(u."FirstName", '') || ' ' || COALESCE(u."LastName", '')), ''), 'Student'),
			       a.date::text, a.status, COALESCE(a.notes, '')
			FROM public.attendance a
			LEFT JOIN public.class c ON a.class_id = c.id::text
			LEFT JOIN public.students s ON a.student_id = s.user_id::text OR a.student_id = s.id::text
			LEFT JOIN public.users u ON u."ID"::text = COALESCE(s.user_id::text, a.student_id)
			WHERE a.class_id = $1 AND ($2 = '' OR a.date::text = $2)
			ORDER BY a.date DESC, a.student_id ASC
		`
		rows, err := conn.Query(context.Background(), query, classId, dateFilter)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database lookup failed: " + err.Error()})
		}
		defer rows.Close()

		records := []AttendanceRecord{}
		for rows.Next() {
			var r AttendanceRecord
			if err := rows.Scan(&r.ID, &r.ClassID, &r.ClassName, &r.StudentID, &r.StudentName, &r.Date, &r.Status, &r.Notes); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse attendance record"})
			}
			records = append(records, r)
		}
		return c.JSON(records)
	}
}

func getClassAttendanceLogs(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		classId := c.Params("classId")
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `
			SELECT a.id::text, a.class_id, COALESCE(c.class_name, ''), a.student_id,
			       COALESCE(NULLIF(TRIM(COALESCE(u."FirstName", '') || ' ' || COALESCE(u."LastName", '')), ''), 'Student'),
			       a.date::text, a.status, COALESCE(a.notes, '')
			FROM public.attendance a
			LEFT JOIN public.class c ON a.class_id = c.id::text
			LEFT JOIN public.students s ON a.student_id = s.user_id::text OR a.student_id = s.id::text
			LEFT JOIN public.users u ON u."ID"::text = COALESCE(s.user_id::text, a.student_id)
			WHERE a.class_id = $1
			ORDER BY a.date DESC, a.student_id ASC
		`
		rows, err := conn.Query(context.Background(), query, classId)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database lookup failed: " + err.Error()})
		}
		defer rows.Close()

		records := []AttendanceRecord{}
		for rows.Next() {
			var r AttendanceRecord
			if err := rows.Scan(&r.ID, &r.ClassID, &r.ClassName, &r.StudentID, &r.StudentName, &r.Date, &r.Status, &r.Notes); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse attendance log"})
			}
			records = append(records, r)
		}

		return c.JSON(GroupAttendanceByDate(records))
	}
}

func getUserAttendance(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		userId := c.Params("userId")
		classFilter := strings.TrimSpace(c.Query("class_id"))
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `
			SELECT a.id::text, a.class_id, COALESCE(c.class_name, 'Class ' || a.class_id), a.student_id,
			       COALESCE(NULLIF(TRIM(COALESCE(u."FirstName", '') || ' ' || COALESCE(u."LastName", '')), ''), 'Student'),
			       a.date::text, a.status, COALESCE(a.notes, '')
			FROM public.attendance a
			LEFT JOIN public.class c ON a.class_id = c.id::text
			LEFT JOIN public.students s ON a.student_id = s.user_id::text OR a.student_id = s.id::text
			LEFT JOIN public.users u ON u."ID"::text = COALESCE(s.user_id::text, a.student_id)
			WHERE (
				a.student_id = $1
				OR a.student_id IN (
					SELECT st.user_id::text FROM public.students st WHERE st.parent_id::text = $1 OR st.user_id::text = $1
					UNION
					SELECT st.id::text FROM public.students st WHERE st.parent_id::text = $1 OR st.user_id::text = $1
				)
			)
			AND ($2 = '' OR a.class_id = $2)
			ORDER BY a.date DESC
		`
		rows, err := conn.Query(context.Background(), query, userId, classFilter)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database lookup failed: " + err.Error()})
		}
		defer rows.Close()

		records := []AttendanceRecord{}
		for rows.Next() {
			var r AttendanceRecord
			if err := rows.Scan(&r.ID, &r.ClassID, &r.ClassName, &r.StudentID, &r.StudentName, &r.Date, &r.Status, &r.Notes); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse attendance record"})
			}
			records = append(records, r)
		}

		return c.JSON(UserAttendanceResponse{
			Summary: CalculateAttendanceSummary(records),
			Records: records,
		})
	}
}

func getClassAnnouncements(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		classId := c.Params("classId")
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `
			SELECT ca.id::text, ca.class_id::text, COALESCE(c.class_name, 'Class ' || ca.class_id::text),
			       COALESCE(ca."Title", ''), COALESCE(ca.content, ''), COALESCE(ca.date::text, '')
			FROM public.class_announcements ca
			LEFT JOIN public.class c ON ca.class_id = c.id
			WHERE ca.class_id::text = $1
			ORDER BY ca.date DESC NULLS LAST, ca.created_at DESC
		`
		rows, err := conn.Query(context.Background(), query, classId)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database lookup failed: " + err.Error()})
		}
		defer rows.Close()

		announcements := []Announcement{}
		for rows.Next() {
			var a Announcement
			if err := rows.Scan(&a.ID, &a.ClassID, &a.ClassName, &a.Title, &a.Content, &a.Date); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to scan announcement"})
			}
			announcements = append(announcements, a)
		}
		return c.JSON(announcements)
	}
}

func postClassAnnouncement(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		classId := c.Params("classId")
		var req Announcement
		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
		}

		req.Title = strings.TrimSpace(req.Title)
		req.Content = strings.TrimSpace(req.Content)
		if req.Title == "" || req.Content == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "title and content are required"})
		}

		dateStr := strings.TrimSpace(req.Date)
		if dateStr == "" {
			dateStr = time.Now().Format("2006-01-02")
		}

		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `
			INSERT INTO public.class_announcements (class_id, "Title", content, date)
			VALUES ($1::bigint, $2, $3, $4::date)
			RETURNING id::text
		`
		var newID string
		if err := conn.QueryRow(context.Background(), query, classId, req.Title, req.Content, dateStr).Scan(&newID); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create announcement: " + err.Error()})
		}

		req.ID = newID
		req.ClassID = classId
		req.Date = dateStr
		return c.Status(fiber.StatusCreated).JSON(req)
	}
}

func getUserAnnouncements(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		userId := c.Params("userId")
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `
			SELECT DISTINCT ca.id::text, ca.class_id::text, COALESCE(c.class_name, 'Class ' || ca.class_id::text),
			       COALESCE(ca."Title", ''), COALESCE(ca.content, ''), COALESCE(ca.date::text, '')
			FROM public.class_announcements ca
			JOIN public.class c ON ca.class_id = c.id
			LEFT JOIN public.teachers t ON c.teacher_id = t.id
			LEFT JOIN public.enrollments e ON c.id = e.class_id
			LEFT JOIN public.students s ON e.student_id = s.id
			WHERE t.user_id::text = $1 OR s.user_id::text = $1 OR s.parent_id::text = $1
			ORDER BY ca.id::text DESC
		`
		rows, err := conn.Query(context.Background(), query, userId)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database lookup failed: " + err.Error()})
		}
		defer rows.Close()

		announcements := []Announcement{}
		for rows.Next() {
			var a Announcement
			if err := rows.Scan(&a.ID, &a.ClassID, &a.ClassName, &a.Title, &a.Content, &a.Date); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to scan announcement"})
			}
			announcements = append(announcements, a)
		}
		return c.JSON(announcements)
	}
}

func getParentOverview(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		parentId := c.Params("parentId")
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		childQuery := `
			SELECT u."ID"::text, s.id::text, COALESCE(u."FirstName", ''), COALESCE(u."LastName", ''), COALESCE(u."Email", '')
			FROM public.students s
			JOIN public.users u ON s.user_id = u."ID"
			WHERE s.parent_id::text = $1 OR s.user_id::text = $1
			ORDER BY u."FirstName" ASC
		`
		childRows, err := conn.Query(ctx, childQuery, parentId)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to lookup linked children: " + err.Error()})
		}
		defer childRows.Close()

		children := []LinkedChildOverview{}
		for childRows.Next() {
			var child LinkedChildOverview
			if err := childRows.Scan(&child.StudentID, &child.InternalID, &child.FirstName, &child.LastName, &child.Email); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to scan child record"})
			}
			child.Classes = []ChildClassInfo{}
			child.Grades = []ChildGradeItem{}
			child.AttendanceRecords = []AttendanceRecord{}
			child.Announcements = []Announcement{}
			children = append(children, child)
		}
		childRows.Close()

		// Populate classes, grades, attendance, and announcements for each linked child
		for idx := range children {
			child := &children[idx]

			// 1. Enrolled Classes
			classRows, err := conn.Query(ctx, `
				SELECT c.id::text, c.class_name, c.subject, COALESCE(u."FirstName" || ' ' || u."LastName", 'Teacher'), c.room_number
				FROM public.enrollments e
				JOIN public.class c ON e.class_id = c.id
				LEFT JOIN public.teachers t ON c.teacher_id = t.id
				LEFT JOIN public.users u ON t.user_id = u."ID"
				WHERE e.student_id::text = $1
			`, child.InternalID)
			if err == nil {
				for classRows.Next() {
					var ci ChildClassInfo
					if err := classRows.Scan(&ci.ID, &ci.Name, &ci.Subject, &ci.Teacher, &ci.RoomNumber); err == nil {
						child.Classes = append(child.Classes, ci)
					}
				}
				classRows.Close()
			}

			// 2. Assignments & Submissions (Grades)
			assignRows, err := conn.Query(ctx, `
				SELECT a.id::text, a.class_id, COALESCE(c.class_name, 'Class ' || a.class_id), a.questions, COALESCE(a.file, ''), a.due_date
				FROM public.assignments a
				JOIN public.class c ON a.class_id = c.id::text
				JOIN public.enrollments e ON c.id = e.class_id
				WHERE e.student_id::text = $1
				ORDER BY a.due_date DESC
			`, child.InternalID)
			if err == nil {
				type rawAssign struct {
					a         assignments.Assignment
					className string
				}
				var childAssignments []rawAssign
				for assignRows.Next() {
					var ra rawAssign
					if err := assignRows.Scan(&ra.a.ID, &ra.a.ClassID, &ra.className, &ra.a.Questions, &ra.a.File, &ra.a.DueDate); err == nil {
						childAssignments = append(childAssignments, ra)
					}
				}
				assignRows.Close()

				for _, ra := range childAssignments {
					assignType := "Quiz / Questions"
					if ra.a.File != "" && len(ra.a.Questions) == 0 {
						assignType = "File Assignment"
					}
					item := ChildGradeItem{
						AssignmentID: ra.a.ID,
						ClassID:      ra.a.ClassID,
						ClassName:    ra.className,
						Type:         assignType,
						DueDate:      ra.a.DueDate.Format(time.RFC3339),
						Grade:        "Not Submitted",
					}

					var sub assignments.Submission
					err := conn.QueryRow(ctx, `
						SELECT id::text, class_id, student_id, assignment_id::text, COALESCE(grade, ''), student_answer, date_submitted
						FROM public.submissions
						WHERE assignment_id::text = $1 AND (student_id = $2 OR student_id = $3)
						ORDER BY date_submitted DESC LIMIT 1
					`, ra.a.ID, child.StudentID, child.InternalID).Scan(
						&sub.ID, &sub.ClassID, &sub.StudentID, &sub.AssignmentID, &sub.Grade, &sub.StudentAnswer, &sub.DateSubmitted,
					)
					if err == nil {
						item.Submitted = true
						item.SubmissionID = sub.ID
						item.Grade = sub.Grade
						item.DateSubmitted = sub.DateSubmitted.Format(time.RFC3339)
						fb := assignments.EvaluateSubmissionFeedback(ra.a, sub)
						item.Feedback = &fb
					}
					child.Grades = append(child.Grades, item)
				}
			}

			// 3. Attendance Summary & Records
			attRows, err := conn.Query(ctx, `
				SELECT a.id::text, a.class_id, COALESCE(c.class_name, 'Class ' || a.class_id), a.student_id,
				       a.date::text, a.status, COALESCE(a.notes, '')
				FROM public.attendance a
				LEFT JOIN public.class c ON a.class_id = c.id::text
				WHERE a.student_id = $1 OR a.student_id = $2
				ORDER BY a.date DESC
			`, child.StudentID, child.InternalID)
			if err == nil {
				for attRows.Next() {
					var r AttendanceRecord
					r.StudentName = strings.TrimSpace(child.FirstName + " " + child.LastName)
					if err := attRows.Scan(&r.ID, &r.ClassID, &r.ClassName, &r.StudentID, &r.Date, &r.Status, &r.Notes); err == nil {
						child.AttendanceRecords = append(child.AttendanceRecords, r)
					}
				}
				attRows.Close()
			}
			child.AttendanceSummary = CalculateAttendanceSummary(child.AttendanceRecords)

			// 4. Class Announcements
			annRows, err := conn.Query(ctx, `
				SELECT ca.id::text, ca.class_id::text, COALESCE(c.class_name, 'Class ' || ca.class_id::text),
				       COALESCE(ca."Title", ''), COALESCE(ca.content, ''), COALESCE(ca.date::text, '')
				FROM public.class_announcements ca
				JOIN public.class c ON ca.class_id = c.id
				JOIN public.enrollments e ON c.id = e.class_id
				WHERE e.student_id::text = $1
				ORDER BY ca.date DESC NULLS LAST, ca.created_at DESC
			`, child.InternalID)
			if err == nil {
				for annRows.Next() {
					var ann Announcement
					if err := annRows.Scan(&ann.ID, &ann.ClassID, &ann.ClassName, &ann.Title, &ann.Content, &ann.Date); err == nil {
						child.Announcements = append(child.Announcements, ann)
					}
				}
				annRows.Close()
			}
		}

		return c.JSON(ParentOverviewResponse{
			ParentID: parentId,
			Children: children,
		})
	}
}
