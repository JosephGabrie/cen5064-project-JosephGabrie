# AI Assistance & Agent Critique Documentation

This document records architectural intents and **AI Critique Blocks** for all pull requests and features where an AI assistant was utilized, in accordance with the CEN 5064 Software Design course requirements.

Each AI critique block details:
1. **What was checked:** Architectural boundaries, domain invariants, edge cases, and test contracts examined by the developer.
2. **What was wrong:** Errors, hallucinations, incorrect assumptions, tier violations, or missing edge cases in the AI's proposal.
3. **What was fixed or kept:** Specific corrections, refactors, and retained verified code.

---

## 1. Assignment & Quiz Creation Subsystem (PR #14 / #16)

### Context & Implementation
- Implemented core domain structs (`Assignment`, `Question`) and Fiber REST handlers for teacher assignment publishing.
- Created React Hook Form UI with Zod validation schema for teachers to create multiple choice, true/false, fill-in-the-blank, and free-form questions.

### AI Critique Block
- **AI Tool / Model:** Claude 3.5 Sonnet / GitHub Copilot
- **What was checked:**
  - Validated that question schemas properly differentiated between objective questions (requiring exact answer matching) and subjective free-form questions.
  - Checked input validation logic across client form and backend handler.
  - Verified keyboard event handling when teachers dynamically add multiple-choice options.
- **What was wrong:**
  - **Free-form answer requirement bug:** The AI generated form validation that marked `expected_answer` as a required field for `free_form` essay questions, which broke teacher submissions.
  - **Premature form submission on Enter:** When adding multiple-choice options, pressing `Enter` triggered form submission rather than adding an option tag.
  - **Tier Leakage:** The AI initially placed question validation inside the Fiber HTTP handler (`handlers.go`) rather than encapsulating domain validation within the `Question.Validate()` and `Assignment.Validate()` domain methods.
- **What was fixed or kept:**
  - **Fixed:** Updated `CreateAssignmentForm.tsx` to conditionally hide and relax the expected answer requirement when `type === 'free_form'`.
  - **Fixed:** Added `e.preventDefault()` on Enter key presses in the options array input.
  - **Fixed:** Moved question and assignment validation rules into domain entity methods (`Question.Validate()`, `Assignment.Validate()`) accompanied by pure unit tests in Go.
  - **Kept:** Kept the React Hook Form structure with Zod resolver and the database JSON column serialization for questions.

---

## 2. Assignment Dashboard & Due Date Editing (PR #18)

### Context & Implementation
- Added active vs. past-due assignment list views for teachers and students, with modal editing for due dates.

### AI Critique Block
- **AI Tool / Model:** GitHub Copilot / GPT-4o
- **What was checked:**
  - Inspected time zone handling and ISO-8601 parsing across the Next.js client, Go backend, and PostgreSQL database.
  - Checked date mutation endpoints (`PUT /api/assignments/:id/due-date`) to ensure they only accept valid future/present timestamps.
- **What was wrong:**
  - **Timezone Drift:** The AI attempted to compare client local timestamps with UTC database timestamps directly in the frontend component (`new Date(assign.due_date) < new Date()`), causing false "past due" classifications around UTC boundary hours.
  - **Missing 404 Guard:** The AI's SQL update handler did not check `RowsAffected()`, returning HTTP 200 even when a non-existent assignment UUID was targeted.
- **What was fixed or kept:**
  - **Fixed:** Added domain method `Assignment.IsLate(t time.Time)` in Go to standardize deadline comparison logic, and normalized frontend timestamps through ISO parsing.
  - **Fixed:** Added `tag.RowsAffected() == 0` check in Fiber handler to return HTTP 404 when target assignment is not found.
  - **Kept:** Kept the Shadcn UI dialog modal and optimistic state updates on successful due date extension.

---

## 3. Instant Auto-Grading Feedback Engine & Submission View (PR #21 / PR #24)

### Context & Implementation
- Implemented `GradeAssignment()` and `EvaluateSubmissionFeedback()` to provide instant scoring and question-by-question breakdown upon submission.
- Built `StudentAssignmentView` component displaying question feedback, earned points, and overall percentage.

### AI Critique Block
- **AI Tool / Model:** Claude 3.5 Sonnet / Antigravity
- **What was checked:**
  - Examined the grading rules: late submissions penalized to `0`, free-form questions flagged for manual review, objective questions auto-graded case-insensitively.
  - Checked percentage calculation for divide-by-zero errors when assignments have `0` points.
- **What was wrong:**
  - **Inconsistent Late Penalty in Feedback:** While `GradeAssignment()` returned `"0"` for late submissions, the AI's generated `EvaluateSubmissionFeedback()` still awarded full points in `EarnedPoints` and `Percentage`, creating a contradiction in the UI between the grade summary and the point tally.
  - **Case Sensitivity Bug:** The string comparison used strict equality (`studentAns == q.Answer`), which falsely failed answers like `"True"` when the teacher stored `"true"`.
  - **Divide-by-zero vulnerability:** Percentage calculation failed if an assignment had 0 total questions/points.
- **What was fixed or kept:**
  - **Fixed:** Standardized case-insensitive matching using `strings.EqualFold(strings.TrimSpace(studentAns), strings.TrimSpace(q.Answer))`.
  - **Fixed:** Ensured `EvaluateSubmissionFeedback` zeros out `EarnedPoints` when `isLate == true`, maintaining parity with `GradeAssignment()`.
  - **Fixed:** Added zero-point guard (`if totalPoints > 0`) before computing percentage.
  - **Kept:** Retained the `SubmissionFeedback` struct and Vitest component test assertions for instant auto-grading feedback.

---

## 4. Attendance Tracking, Seating Grid & Parent Portal (PR #22 / PR #23)

### Context & Implementation
- Added classroom seating chart manager, daily attendance recording (present/absent/tardy), and the Parent Portal dashboard with attendance metrics.

### AI Critique Block
- **AI Tool / Model:** Claude 3.5 Sonnet / Google Gemini
- **What was checked:**
  - Checked seating plan validation: bounds checking, duplicate student assignments, and coordinate collision detection.
  - Checked attendance summary percentage formulas and grouping by date.
- **What was wrong:**
  - **Unmounted Routes in main.go:** The AI created all routes in `attendance/handlers.go` inside `SetupAttendanceAndPortalRoutes()`, but completely forgot to register them in `backend/main/main.go`. Without manual verification, all attendance API calls would 404 on deployment!
  - **Seating Collision Logic Flaw:** The initial seating validation only checked if two students shared the same row/col coordinate, but did not detect if one student was assigned to multiple different desks simultaneously.
  - **Undefined Status Handling:** The attendance calculator didn't normalize status strings, causing capitalized entries (e.g., `"Present"`) to be omitted from the counts.
- **What was fixed or kept:**
  - **Fixed:** Registered `attendance.SetupAttendanceAndPortalRoutes(app, conn)` in `backend/main/main.go`.
  - **Fixed:** Added two-way collision checks in `ValidateSeatingPlan`: coordinate collision (`occupiedCoords[coordKey]`) and student multiplicity (`assignedStudents[studentID]`).
  - **Fixed:** Added `NormalizeAttendanceStatus()` and `AttendanceRecord.Validate()` domain methods with unit test coverage.
  - **Kept:** Kept the interactive drag-and-drop seating grid UI and parent portal overview aggregates.

---

## 5. Domain Business Rule Refactoring & Diagram Alignment (Final Rubric Fix)

### Context & Implementation
- Refactored core business rules out of controllers and services into dedicated Domain classes (`User`, `Class`, `Assignment`, `Question`, `Submission`, `AttendanceRecord`).
- Aligned UML Class Diagram and C4 Container Diagrams with actual codebase symbols and marked planned systems with dashed borders and `<<planned>>`.

### AI Critique Block
- **AI Tool / Model:** Google Antigravity (Gemini 3.8)
- **What was checked:**
  - Checked that every class and method in `README.md`'s UML class diagram exists in the Go backend with identical signatures and pure unit test coverage.
  - Checked that unbuilt features (such as AI plagiarism detection and external SMS notifications) are explicitly designated as `<<planned>>` with dashed borders.
  - Checked that all domain invariant checks are backed by red-green unit tests.
- **What was wrong:**
  - **HTTP Handlers in Class Diagram:** The previous class diagram included `+PostAssignment()` and `+PutDueDate()` as methods on the `Assignment` class. These are HTTP route handlers (Service tier), not domain methods.
  - **Missing User Domain Struct:** The codebase previously queried users into ad-hoc primitive variables in `signIn.go` without a domain `User` struct or domain-level password verification / role validation methods.
  - **Untested Auth Package:** `backend/auth/auth_test.go` had 0 tests, leaving password verification and role enforcement untested at the unit level.
- **What was fixed or kept:**
  - **Fixed:** Created `auth.User` domain model with `Validate()`, `HasRole()`, `FullName()`, and `VerifyPassword()` methods, backed by unit tests in `auth_test.go`.
  - **Fixed:** Added domain methods to `Class` (`Validate`, `MatchesSubject`) with unit tests in `api/class_test.go`.
  - **Fixed:** Added domain methods to `Assignment`, `Question`, and `Submission` (`Validate`, `IsLate`, `TotalPoints`, `GradeSubmission`, `EvaluateFeedback`, `EvaluateAnswer`, `GetAnswerForQuestion`) with unit tests in `grading_test.go`.
  - **Fixed:** Updated UML class diagram in `README.md` so that every method is an actual domain method on the struct, and styled planned external services with `style <Class> stroke-dasharray: 5 5` and `<<planned>>`.

---

## 6. Admin Dashboard: School-Wide Metrics & Class Scheduling (`27-admin-dashboard-class-scheduling-teacher-assignment`)

### Context & Implementation
- Created `backend/admin/` package (`models.go`, `handlers.go`, `admin_test.go`) implementing:
  - Domain models and pure business rules: `CalculateSchoolMetrics()`, `(c *AdminClassSection) Validate(assignedUserRole string) error`, and `ValidateStudentEnrollment(studentID string, existingStudentIDs []string) error`.
  - Role-based middleware (`AdminRoleMiddleware()`) enforcing admin authorization via JWT or `X-User-Role` header.
  - REST endpoints: `GET /api/admin/metrics`, `GET /api/admin/teachers`, `GET /api/admin/students`, `GET /api/admin/classes`, `POST /api/admin/classes`, `POST /api/admin/classes/:classId/enroll`, and `DELETE /api/admin/classes/:classId/enroll/:studentId`.
- Built `frontend/components/dashboards/AdminDashboard.tsx` and `frontend/components/dashboards/AdminDashboard.test.tsx`, and wired role-based rendering in `frontend/app/page.tsx`.
- Resolved all Frontend CI ESLint errors (`react-hooks/preserve-manual-memoization` in `assignments/page.tsx` and `quizzes/page.tsx`) and warnings.

### AI Critique Block
- **AI Tool / Model:** Google Antigravity (Gemini 3.8)
- **What was checked:**
  - Checked domain validation rules for class creation (non-empty name/subject/room/teacher and verifying the assigned user holds the `teacher` role), duplicate student enrollment prevention, and zero-division guards in attendance rate calculations.
  - Checked React Compiler memoization dependency inference (`react-hooks/preserve-manual-memoization`) on `useCallback` hooks in Next.js client pages.
  - Checked Node 22+ / Vitest jsdom compatibility when accessing `window.localStorage` in `AdminDashboard.tsx`.
- **What was wrong:**
  - **React Compiler Memoization Mismatch:** Passing `[classId, user?.id, user?.role]` directly in `useCallback` caused the React Compiler ESLint plugin to fail CI because `user` was accessed inside the callback body, making the inferred dependency (`user`) less specific than the manual dependency array.
  - **Node 22+ `localStorage.getItem` Runtime Exception in Vitest:** Calling `localStorage.getItem("token")` only after `typeof window !== "undefined"` threw `TypeError: localStorage.getItem is not a function` in Node 22's experimental WebStorage environment during Vitest execution, causing `loadDashboardData()` to fail silently in tests.
- **What was fixed or kept:**
  - **Fixed:** Destructured `const userId = user?.id; const userRole = user?.role;` prior to `useCallback` in `assignments/page.tsx` and `quizzes/page.tsx` so manual dependencies match inferred primitive values.
  - **Fixed:** Guarded `window.localStorage?.getItem` with `typeof window.localStorage?.getItem === "function"` in `buildAdminHeaders()`.
  - **Kept:** Kept the pure domain functions (`CalculateSchoolMetrics`, `AdminClassSection.Validate`, `ValidateStudentEnrollment`) and full unit/component test suites across Go and Vitest.

---

## 7. Admin Dashboard: User Management & Directory (`26-admin-dashboard-user-management-directory`)

### Context & Implementation
- Extended `backend/admin/` (`models.go`, `handlers.go`, `admin_test.go`) with User Management & Directory capabilities:
  - Domain models and pure business rules: `AdminUserRecord.MatchesFilter()`, `FilterUsers()`, `CreateUserRequest.Validate()`, `HashUserPassword()`, and `ValidateParentStudentLink()`.
  - Service endpoints: `GET /api/admin/users` (with optional `role` and `search` query parameters), `POST /api/admin/users` (hashes password with bcrypt, creates `public.users` record, and initializes `public.students` or `public.teachers` rows as needed), and `POST /api/admin/parent-links` (validates parent and student roles, prevents duplicate links, and persists `parent_id` on `public.students`).
- Extended `frontend/components/dashboards/AdminDashboard.tsx` and `frontend/components/dashboards/AdminDashboard.test.tsx` with:
  - Searchable, role-filterable User Directory table showing School ID, Full Name, Email, Role badge, and Family / Portal Links.
  - "Create New User Account" modal and "Link Parent to Student Account" modal with optimistic state updates and validation feedback.

### AI Critique Block
- **AI Tool / Model:** Google Antigravity (Gemini 3.8)
- **What was checked:**
  - Checked domain validation when creating users (`CreateUserRequest.Validate()`) to ensure it delegates to `auth.User.Validate()` for email format and role whitelist while additionally enforcing password minimum length (`>= 6` characters) and non-empty first/last names.
  - Checked parent-student linking schema against `backend/attendance/handlers.go` (`getParentOverview`) to ensure parent-child links created in the Admin Dashboard immediately work in the Parent Portal.
- **What was wrong:**
  - **Parent-Student Schema Alignment:** An initial assumption was a separate `parent_students` join table, whereas `getParentOverview` in `backend/attendance/handlers.go` queries `FROM public.students s JOIN public.users u ON s.user_id = u."ID" WHERE s.parent_id::text = $1`. Using a different table would have prevented newly linked children from appearing in the Parent Portal.
  - **Duplicate Text Assertion in Tests:** Once the User Directory table was added alongside the Class Schedule table, `"Timmy Teacher"` appeared in both tables, requiring `screen.getAllByText("Timmy Teacher")` rather than `screen.getByText("Timmy Teacher")`.
- **What was fixed or kept:**
  - **Fixed:** Implemented `getAdminUsers` and `postParentStudentLink` directly against `public.students.parent_id` so links created by an admin are immediately reflected in the Parent Portal.
  - **Fixed:** Automatically provisioned `public.students` or `public.teachers` rows when `POST /api/admin/users` creates a student or teacher account.
  - **Kept:** Kept pure domain filtering (`FilterUsers`, `MatchesFilter`) and validation (`ValidateParentStudentLink`, `CreateUserRequest.Validate`) with unit tests in `backend/admin/admin_test.go` and component tests in `AdminDashboard.test.tsx`.

---

## 8. Admin Dashboard: School-Wide Metrics & Operational Breakdown (`25-admin-dashboard-school-wide-metrics-overview`)

### Context & Implementation
- Enhanced `SchoolMetrics` and `CalculateSchoolMetrics()` in `backend/admin/models.go` with:
  - `TotalParents`, `TotalAdmins`, `StudentTeacherRatio` (computed with a zero-division guard when `teacherCount == 0`), and `AttendanceStatus`.
  - Pure domain method `(m *SchoolMetrics) EvaluateAttendanceStatus() string` classifying daily campus attendance into `"Healthy"` (`>= 90%`), `"Moderate"` (`>= 75%`), `"Needs Attention"` (`< 75%`), or `"No Records Today"` (`0` records).
- Updated `getSchoolMetrics` and `SetupAdminRoutes` in `backend/admin/handlers.go` to query parent and admin headcounts and support both `/api/admin/parent-links` and `/api/admin/parents/link` route paths.
- Enhanced `frontend/components/dashboards/AdminDashboard.tsx` with the **Campus Attendance Status & Student-to-Teacher Ratio** breakdown panel (`data-testid="school-metrics-breakdown"`), visual daily attendance progress bar, and optional `School ID (Optional)` field in the user creation modal.

### AI Critique Block
- **AI Tool / Model:** Google Antigravity (Gemini 3.8)
- **What was checked:**
  - Checked every requirement in the "Done when" checklists across School-Wide Metrics, User Management & Directory, and Class Scheduling & Teacher Assignment.
  - Verified zero-division safety in `CalculateSchoolMetrics` when `teacherCount == 0` or `TotalRecordedToday == 0`.
  - Checked endpoint route path consistency between `/api/admin/parent-links` and `/api/admin/parents/link`.
- **What was wrong:**
  - **Zero-Teacher Ratio Edge Case:** Computing `float64(studentCount) / float64(teacherCount)` without a `teacherCount > 0` check would produce `+Inf` or `NaN` in JSON serialization when a fresh database has 0 teachers.
  - **Missing Optional Identifier Field in User Modal:** The "Done when" checklist specified an optional Identifier/ID field in the Add New User modal, which was supported in the backend (`CreateUserRequest.ID`) but initially omitted from the modal inputs.
- **What was fixed or kept:**
  - **Fixed:** Guarded `StudentTeacherRatio` calculation with `if teacherCount > 0` and added unit test assertions in `TestCalculateSchoolMetrics`.
  - **Fixed:** Added the `School ID (Optional)` input field to the Create User modal in `AdminDashboard.tsx` and registered `/api/admin/parents/link` alongside `/api/admin/parent-links`.
  - **Kept:** Retained the unified Admin Dashboard architecture across all three feature branches with 100% passing Go and Vitest suites.

