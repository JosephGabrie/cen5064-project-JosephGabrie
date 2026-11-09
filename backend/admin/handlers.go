package admin

import (
	"context"
	"os"
	"strings"

	"MTVSChool/attendance"
	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AdminRoleMiddleware verifies that when an Authorization token or X-User-Role header is provided,
// the requester has the "admin" role.
func AdminRoleMiddleware() fiber.Handler {
	return func(c fiber.Ctx) error {
		roleHeader := strings.TrimSpace(c.Get("X-User-Role"))
		if roleHeader != "" && !strings.EqualFold(roleHeader, "admin") {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Forbidden: admin role required",
			})
		}

		authHeader := strings.TrimSpace(c.Get("Authorization"))
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
			secret := os.Getenv("JWT_SECRET")
			if tokenString != "" && secret != "" {
				token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
					return []byte(secret), nil
				})
				if err != nil || !token.Valid {
					return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
						"error": "Invalid authorization token",
					})
				}
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					if claimRole, ok := claims["role"].(string); ok && !strings.EqualFold(claimRole, "admin") {
						return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
							"error": "Forbidden: admin role required",
						})
					}
				}
			}
		}

		return c.Next()
	}
}

// SetupAdminRoutes registers the Admin Dashboard endpoints for school-wide metrics and class scheduling.
func SetupAdminRoutes(app *fiber.App, conn *pgxpool.Pool) {
	group := app.Group("/api/admin", AdminRoleMiddleware())

	group.Get("/metrics", getSchoolMetrics(conn))
	group.Get("/teachers", getTeachers(conn))
	group.Get("/students", getStudents(conn))
	group.Get("/classes", getAdminClasses(conn))
	group.Post("/classes", postAdminClass(conn))
	group.Post("/classes/:classId/enroll", postEnrollStudent(conn))
	group.Delete("/classes/:classId/enroll/:studentId", deleteEnrollStudent(conn))
}

func getSchoolMetrics(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		var studentCount, teacherCount, parentCount, adminCount, classCount int

		_ = conn.QueryRow(ctx, `SELECT COUNT(*) FROM public.users WHERE LOWER("Role") = 'student'`).Scan(&studentCount)
		_ = conn.QueryRow(ctx, `SELECT COUNT(*) FROM public.users WHERE LOWER("Role") = 'teacher'`).Scan(&teacherCount)
		_ = conn.QueryRow(ctx, `SELECT COUNT(*) FROM public.users WHERE LOWER("Role") = 'parent'`).Scan(&parentCount)
		_ = conn.QueryRow(ctx, `SELECT COUNT(*) FROM public.users WHERE LOWER("Role") = 'admin'`).Scan(&adminCount)
		_ = conn.QueryRow(ctx, `SELECT COUNT(*) FROM public.class`).Scan(&classCount)

		statuses := []string{}
		rows, err := conn.Query(ctx, `SELECT status FROM public.attendance WHERE date = CURRENT_DATE`)
		if err == nil {
			for rows.Next() {
				var st string
				if err := rows.Scan(&st); err == nil {
					statuses = append(statuses, st)
				}
			}
			rows.Close()
		}

		if len(statuses) == 0 {
			fallbackRows, err := conn.Query(ctx, `
				SELECT status FROM public.attendance
				WHERE date = (SELECT MAX(date) FROM public.attendance)
			`)
			if err == nil {
				for fallbackRows.Next() {
					var st string
					if err := fallbackRows.Scan(&st); err == nil {
						statuses = append(statuses, st)
					}
				}
				fallbackRows.Close()
			}
		}

		metrics := CalculateSchoolMetrics(studentCount, teacherCount, classCount, statuses)
		metrics.TotalParents = parentCount
		metrics.TotalAdmins = adminCount
		return c.JSON(metrics)
	}
}

func getTeachers(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `
			SELECT COALESCE(t.id::text, u."ID"::text), u."ID"::text,
			       COALESCE(u."FirstName", ''), COALESCE(u."LastName", ''),
			       COALESCE(u."Email", ''), COALESCE(u."Role", 'teacher')
			FROM public.users u
			LEFT JOIN public.teachers t ON t.user_id = u."ID"
			WHERE LOWER(u."Role") = 'teacher'
			ORDER BY u."LastName" ASC, u."FirstName" ASC
		`
		rows, err := conn.Query(context.Background(), query)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch teachers: " + err.Error()})
		}
		defer rows.Close()

		teachers := []TeacherOption{}
		for rows.Next() {
			var t TeacherOption
			if err := rows.Scan(&t.ID, &t.UserID, &t.FirstName, &t.LastName, &t.Email, &t.Role); err == nil {
				teachers = append(teachers, t)
			}
		}
		return c.JSON(teachers)
	}
}

func getStudents(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		query := `
			SELECT u."ID"::text, COALESCE(s.id::text, u."ID"::text),
			       COALESCE(u."FirstName", ''), COALESCE(u."LastName", ''),
			       COALESCE(u."Email", '')
			FROM public.users u
			LEFT JOIN public.students s ON s.user_id = u."ID"
			WHERE LOWER(u."Role") = 'student'
			ORDER BY u."LastName" ASC, u."FirstName" ASC
		`
		rows, err := conn.Query(context.Background(), query)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch students: " + err.Error()})
		}
		defer rows.Close()

		students := []attendance.EnrolledStudent{}
		for rows.Next() {
			var st attendance.EnrolledStudent
			if err := rows.Scan(&st.StudentID, &st.InternalID, &st.FirstName, &st.LastName, &st.Email); err == nil {
				students = append(students, st)
			}
		}
		return c.JSON(students)
	}
}

func getAdminClasses(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		query := `
			SELECT c.id::text, COALESCE(c.class_name, ''), COALESCE(c.subject, ''), COALESCE(c.room_number::text, ''),
			       COALESCE(t.user_id::text, c.teacher_id::text, ''),
			       COALESCE(NULLIF(TRIM(COALESCE(u."FirstName", '') || ' ' || COALESCE(u."LastName", '')), ''), 'Unassigned')
			FROM public.class c
			LEFT JOIN public.teachers t ON c.teacher_id = t.id
			LEFT JOIN public.users u ON t.user_id = u."ID"
			ORDER BY c.id ASC
		`
		rows, err := conn.Query(ctx, query)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch classes: " + err.Error()})
		}
		defer rows.Close()

		classes := []AdminClassSection{}
		for rows.Next() {
			var cls AdminClassSection
			if err := rows.Scan(&cls.ID, &cls.Name, &cls.Subject, &cls.RoomNumber, &cls.TeacherID, &cls.TeacherName); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse class row"})
			}
			cls.Students = []attendance.EnrolledStudent{}
			classes = append(classes, cls)
		}
		rows.Close()

		for i := range classes {
			stRows, err := conn.Query(ctx, `
				SELECT u."ID"::text, s.id::text, COALESCE(u."FirstName", ''), COALESCE(u."LastName", ''), COALESCE(u."Email", '')
				FROM public.enrollments e
				JOIN public.students s ON e.student_id = s.id
				JOIN public.users u ON s.user_id = u."ID"
				WHERE e.class_id::text = $1
				ORDER BY u."LastName" ASC, u."FirstName" ASC
			`, classes[i].ID)
			if err == nil {
				for stRows.Next() {
					var st attendance.EnrolledStudent
					if err := stRows.Scan(&st.StudentID, &st.InternalID, &st.FirstName, &st.LastName, &st.Email); err == nil {
						classes[i].Students = append(classes[i].Students, st)
					}
				}
				stRows.Close()
			}
			classes[i].EnrolledCount = len(classes[i].Students)
		}

		return c.JSON(classes)
	}
}

func postAdminClass(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		var req AdminClassSection
		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
		}

		req.Name = strings.TrimSpace(req.Name)
		req.Subject = strings.TrimSpace(req.Subject)
		req.RoomNumber = strings.TrimSpace(req.RoomNumber)
		req.TeacherID = strings.TrimSpace(req.TeacherID)

		if conn == nil {
			if err := req.Validate("teacher"); err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		var userID, userRole, firstName, lastName, teacherTableID string
		lookupErr := conn.QueryRow(ctx, `
			SELECT u."ID"::text, COALESCE(u."Role", ''), COALESCE(u."FirstName", ''), COALESCE(u."LastName", ''), COALESCE(t.id::text, '')
			FROM public.users u
			LEFT JOIN public.teachers t ON t.user_id = u."ID"
			WHERE u."ID"::text = $1 OR t.id::text = $1
			LIMIT 1
		`, req.TeacherID).Scan(&userID, &userRole, &firstName, &lastName, &teacherTableID)

		if lookupErr != nil {
			if err := req.Validate(""); err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Specified teacher was not found"})
		}

		if err := req.Validate(userRole); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		if teacherTableID == "" {
			err := conn.QueryRow(ctx, `INSERT INTO public.teachers (user_id) VALUES ($1::bigint) RETURNING id::text`, userID).Scan(&teacherTableID)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to register teacher record: " + err.Error()})
			}
		}

		var createdClassID string
		err := conn.QueryRow(ctx, `
			INSERT INTO public.class (class_name, subject, room_number, teacher_id)
			VALUES ($1, $2, $3, $4::bigint)
			RETURNING id::text
		`, req.Name, req.Subject, req.RoomNumber, teacherTableID).Scan(&createdClassID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create class: " + err.Error()})
		}

		req.ID = createdClassID
		req.TeacherID = userID
		req.TeacherName = strings.TrimSpace(firstName + " " + lastName)
		req.Students = []attendance.EnrolledStudent{}
		req.EnrolledCount = 0

		return c.Status(fiber.StatusCreated).JSON(req)
	}
}

func postEnrollStudent(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		classID := strings.TrimSpace(c.Params("classId"))
		var req EnrollStudentRequest
		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
		}

		if err := ValidateStudentEnrollment(req.StudentID, nil); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		existingIDs := []string{}
		rows, err := conn.Query(ctx, `
			SELECT u."ID"::text, s.id::text
			FROM public.enrollments e
			JOIN public.students s ON e.student_id = s.id
			JOIN public.users u ON s.user_id = u."ID"
			WHERE e.class_id::text = $1
		`, classID)
		if err == nil {
			for rows.Next() {
				var uid, sid string
				if err := rows.Scan(&uid, &sid); err == nil {
					existingIDs = append(existingIDs, uid, sid)
				}
			}
			rows.Close()
		}

		if err := ValidateStudentEnrollment(req.StudentID, existingIDs); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		var studentTableID, userID, firstName, lastName, email string
		err = conn.QueryRow(ctx, `
			SELECT u."ID"::text, COALESCE(s.id::text, ''), COALESCE(u."FirstName", ''), COALESCE(u."LastName", ''), COALESCE(u."Email", '')
			FROM public.users u
			LEFT JOIN public.students s ON s.user_id = u."ID"
			WHERE (u."ID"::text = $1 OR s.id::text = $1) AND LOWER(u."Role") = 'student'
			LIMIT 1
		`, strings.TrimSpace(req.StudentID)).Scan(&userID, &studentTableID, &firstName, &lastName, &email)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Student not found"})
		}

		if studentTableID == "" {
			err = conn.QueryRow(ctx, `INSERT INTO public.students (user_id) VALUES ($1::bigint) RETURNING id::text`, userID).Scan(&studentTableID)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to initialize student record: " + err.Error()})
			}
		}

		_, err = conn.Exec(ctx, `
			INSERT INTO public.enrollments (class_id, student_id)
			VALUES ($1::bigint, $2::bigint)
		`, classID, studentTableID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to enroll student: " + err.Error()})
		}

		return c.Status(fiber.StatusCreated).JSON(attendance.EnrolledStudent{
			StudentID:  userID,
			InternalID: studentTableID,
			FirstName:  firstName,
			LastName:   lastName,
			Email:      email,
		})
	}
}

func deleteEnrollStudent(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		classID := strings.TrimSpace(c.Params("classId"))
		studentID := strings.TrimSpace(c.Params("studentId"))
		if classID == "" || studentID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "classId and studentId are required"})
		}

		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		tag, err := conn.Exec(ctx, `
			DELETE FROM public.enrollments
			WHERE class_id::text = $1
			  AND (student_id::text = $2 OR student_id IN (SELECT id FROM public.students WHERE user_id::text = $2))
		`, classID, studentID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to remove student from class: " + err.Error()})
		}
		if tag.RowsAffected() == 0 {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Enrollment not found"})
		}

		return c.JSON(fiber.Map{"status": "removed", "class_id": classID, "student_id": studentID})
	}
}

func getAdminUsers(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		query := `
			SELECT u."ID"::text,
			       COALESCE(u."FirstName", ''),
			       COALESCE(u."LastName", ''),
			       COALESCE(u."Email", ''),
			       LOWER(COALESCE(u."Role", 'student')),
			       COALESCE(u."Birthday"::text, ''),
			       COALESCE(u."Address", ''),
			       COALESCE(s.parent_id::text, '')
			FROM public.users u
			LEFT JOIN public.students s ON s.user_id = u."ID"
			ORDER BY u."FirstName" ASC, u."LastName" ASC
		`
		rows, err := conn.Query(ctx, query)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch users: " + err.Error()})
		}
		defer rows.Close()

		users := []AdminUserRecord{}
		parentChildrenMap := make(map[string][]string)

		for rows.Next() {
			var u AdminUserRecord
			if err := rows.Scan(
				&u.ID,
				&u.FirstName,
				&u.LastName,
				&u.Email,
				&u.Role,
				&u.Birthday,
				&u.Address,
				&u.LinkedParentID,
			); err == nil {
				if u.LinkedParentID != "" {
					parentChildrenMap[u.LinkedParentID] = append(parentChildrenMap[u.LinkedParentID], u.ID)
				}
				users = append(users, u)
			}
		}

		for i := range users {
			if children, ok := parentChildrenMap[users[i].ID]; ok {
				users[i].LinkedStudentIDs = children
			}
		}

		roleFilter := c.Query("role")
		searchQuery := c.Query("search")
		filtered := FilterUsers(users, roleFilter, searchQuery)
		return c.JSON(filtered)
	}
}

func postAdminUser(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		var req CreateUserRequest
		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON body"})
		}

		if err := req.Validate(); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		hashPass, err := HashUserPassword(req.Password)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		userID := strings.TrimSpace(req.ID)
		normalizedRole := strings.ToLower(strings.TrimSpace(req.Role))
		if userID == "" {
			userID = GenerateSchoolUserID(normalizedRole)
		}

		var existingCount int
		_ = conn.QueryRow(ctx, `
			SELECT COUNT(*) FROM public.users
			WHERE "ID"::text = $1 OR LOWER(COALESCE("Email", '')) = LOWER($2)
		`, userID, strings.TrimSpace(req.Email)).Scan(&existingCount)
		if existingCount > 0 {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "A user with this ID or email already exists"})
		}

		var birthdayPtr *string
		if strings.TrimSpace(req.Birthday) != "" {
			b := strings.TrimSpace(req.Birthday)
			birthdayPtr = &b
		}
		var addressPtr *string
		if strings.TrimSpace(req.Address) != "" {
			a := strings.TrimSpace(req.Address)
			addressPtr = &a
		}
		emailVal := strings.TrimSpace(req.Email)

		var createdID string
		err = conn.QueryRow(ctx, `
			INSERT INTO public.users ("ID", "FirstName", "LastName", "Birthday", "Address", "Role", "Email", password_hash)
			VALUES ($1::bigint, $2, $3, $4, $5, $6, $7, $8)
			RETURNING "ID"::text
		`,
			userID,
			strings.TrimSpace(req.FirstName),
			strings.TrimSpace(req.LastName),
			birthdayPtr,
			addressPtr,
			normalizedRole,
			emailVal,
			hashPass,
		).Scan(&createdID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create user: " + err.Error()})
		}

		if normalizedRole == "student" {
			_, _ = conn.Exec(ctx, `INSERT INTO public.students (user_id) VALUES ($1::bigint) ON CONFLICT DO NOTHING`, createdID)
		} else if normalizedRole == "teacher" {
			_, _ = conn.Exec(ctx, `INSERT INTO public.teachers (user_id) VALUES ($1::bigint) ON CONFLICT DO NOTHING`, createdID)
		}

		createdUser := AdminUserRecord{
			ID:        createdID,
			FirstName: strings.TrimSpace(req.FirstName),
			LastName:  strings.TrimSpace(req.LastName),
			Email:     emailVal,
			Role:      normalizedRole,
			Birthday:  strings.TrimSpace(req.Birthday),
			Address:   strings.TrimSpace(req.Address),
		}
		return c.Status(fiber.StatusCreated).JSON(createdUser)
	}
}

func postParentStudentLink(conn *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		var req ParentStudentLinkRequest
		if err := c.Bind().Body(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON body"})
		}

		parentID := strings.TrimSpace(req.ParentID)
		studentID := strings.TrimSpace(req.StudentID)
		if parentID == "" || studentID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": ErrMissingParentOrStudentID.Error()})
		}

		if conn == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database connection missing"})
		}

		ctx := context.Background()
		var parentRole string
		err := conn.QueryRow(ctx, `SELECT COALESCE("Role", '') FROM public.users WHERE "ID"::text = $1`, parentID).Scan(&parentRole)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Parent user not found"})
		}

		var studentRole string
		err = conn.QueryRow(ctx, `SELECT COALESCE("Role", '') FROM public.users WHERE "ID"::text = $1`, studentID).Scan(&studentRole)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Student user not found"})
		}

		existingLinks := []string{}
		linkRows, err := conn.Query(ctx, `
			SELECT user_id::text FROM public.students WHERE parent_id::text = $1
		`, parentID)
		if err == nil {
			for linkRows.Next() {
				var sID string
				if err := linkRows.Scan(&sID); err == nil {
					existingLinks = append(existingLinks, sID)
				}
			}
			linkRows.Close()
		}

		if err := ValidateParentStudentLink(parentID, parentRole, studentID, studentRole, existingLinks); err != nil {
			status := fiber.StatusBadRequest
			if err == ErrDuplicateParentStudentLink {
				status = fiber.StatusConflict
			}
			return c.Status(status).JSON(fiber.Map{"error": err.Error()})
		}

		var studentRowID string
		_ = conn.QueryRow(ctx, `SELECT id::text FROM public.students WHERE user_id::text = $1 LIMIT 1`, studentID).Scan(&studentRowID)
		if studentRowID == "" {
			err = conn.QueryRow(ctx, `
				INSERT INTO public.students (user_id, parent_id)
				VALUES ($1::bigint, $2::bigint)
				RETURNING id::text
			`, studentID, parentID).Scan(&studentRowID)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to link parent to student: " + err.Error()})
			}
		} else {
			_, err = conn.Exec(ctx, `
				UPDATE public.students SET parent_id = $1::bigint WHERE id::text = $2
			`, parentID, studentRowID)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update parent-student link: " + err.Error()})
			}
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"status":     "linked",
			"parent_id":  parentID,
			"student_id": studentID,
		})
	}
}
