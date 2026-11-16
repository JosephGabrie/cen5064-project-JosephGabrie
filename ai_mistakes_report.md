# AI Mistakes Report

## 1. Admin User Creation & Family/Medical Attachments
- **Tried:** Creating students and parents with only basic identity fields (`FirstName`, `LastName`, `Email`, `Role`, `Password`) and forcing admins to open a separate modal afterward to link parents and students using plain `<select>` dropdowns.
- **Failed because:** Admins could not attach parents, allergies, emergency contact info, or student notes during student creation, could not attach children during parent creation, and scrolling through a plain dropdown fails when managing hundreds of users.
- **Ended up doing:** Added `allergies`, `emergency_contact`, and `notes` columns to `public.students`, updated `POST /api/admin/users` and `GET /api/admin/users` to persist parent/child links and medical/contact notes during user creation, and added type-to-search inputs (by name or ID) for attaching parents, children, and linking accounts to fix the mistake.

## 2. Admin Class Creation (`meeting_time` Null Constraint) & Admin Page Structure
- **Tried:** Inserting new classes with `INSERT INTO public.class (class_name, subject, room_number, teacher_id)` without `meeting_time`, using a non-searchable teacher dropdown, and stacking all admin tables and buttons vertically in a cluttered layout.
- **Failed because:** PostgreSQL rejected class creation with `ERROR: null value in column "meeting_time" of relation "class" violates not-null constraint (SQLSTATE 23502)`, teachers could not be searched by typing name/ID, and the admin dashboard layout was disorganized.
- **Ended up doing:** Added `meeting_time` to `AdminClassSection`, the class creation modal, and the `INSERT INTO public.class` SQL query, added a searchable teacher input (by name or ID), and restructured `AdminDashboard.tsx` with a unified top command bar and section navigation tabs to fix the mistake.

## 3. Attendance Visibility & Seating Grid Interaction
- **Tried:** Showing the Attendance & Seating page to all roles (including students) and using `<select>` dropdowns inside every desk cell instead of real drag-and-drop.
- **Failed because:** Students should not be able to view attendance records (only teachers and parents should), and clicking dropdowns on each desk was tedious instead of draggable.
- **Ended up doing:** Restricted attendance navigation and page access to teachers, parents, and admins (`app-sidebar.tsx`, `class/[classId]/page.tsx`, `attendance/page.tsx`, `ClassroomAttendanceManager.tsx`) and replaced the per-desk dropdowns with a draggable student roster pool and drag-and-drop desk cells (supporting drag-to-assign, drag-to-swap, and drag-to-unassign) to fix the mistake.

## 4. Add Question Button Placement & Student Names on Submissions
- **Tried:** Placing the `+ Add Question` button at the top header of the Questions section in `CreateAssignmentForm.tsx` and displaying `Student ID: {sub.student_id}` in the teacher's submissions list.
- **Failed because:** Teachers had to scroll back to the top after writing each question instead of having `+ Add Question` directly above `Publish Assignment`, and raw numeric student IDs were unreadable compared to student names.
- **Ended up doing:** Moved the `+ Add Question` button to the bottom of the question list directly above `Publish Assignment`, joined `public.users` in the submission queries to return `student_name`, and displayed the student's full name in `assignments/page.tsx` to fix the mistake.

## 5. Class Grades & Feedback Page Hierarchy & Teacher Review Feedback
- **Tried:** Rendering a flat list of assignment submissions on the Class Grades & Feedback page without grouping by student or supporting written teacher review feedback.
- **Failed because:** Teachers and parents could not see a list of students with their overall grades first and click a student's name to drill down into their assignments and optional written review feedback.
- **Ended up doing:** Added `teacher_feedback` to `public.submissions` and `PUT /api/submissions/:id/grade`, and restructured `grades/page.tsx` into a hierarchical view (`Students with Overall Grades` -> click student name -> `Student's Assignments` with optional teacher review feedback at the bottom) to fix the mistake.

## 6. Redundant Route Requests When Clicking Active Sidebar Links
- **Tried:** Rendering `<Link href={item.url} />` in `app-sidebar.tsx` without guarding against clicks when the user is already on that exact route.
- **Failed because:** Clicking "Assignments" repeatedly in the sidebar triggered redundant Next.js soft-navigation requests (`GET /class/1/assignments 200`) on every click.
- **Ended up doing:** Added an active-route click guard (`if (isActive) e.preventDefault()`) in `app-sidebar.tsx` so clicking the already-active sidebar item does not fire redundant requests to fix the mistake.

## 7. Missing Assignment Name in Assignment Creation & Calendar
- **Tried:** Creating assignments without a `title` / assignment name field and hardcoding `Class {a.class_id} Due` on the Calendar page.
- **Failed because:** Teachers had no way to name an assignment during creation, causing the calendar to only display generic labels like `Class 1 Due`.
- **Ended up doing:** Added a `title` column to `public.assignments`, added an `Assignment Name` input to `CreateAssignmentForm.tsx`, and updated `calendar/page.tsx`, `assignments/page.tsx`, `quizzes/page.tsx`, and `grades/page.tsx` to display the assignment name to fix the mistake.

## 8. Mermaid `classDiagram` Parse Error in `README.md`
- **Tried:** Using flowchart CSS styling (`style NotificationService stroke-dasharray: 5 5`) inside a Mermaid `classDiagram` block in `README.md`.
- **Failed because:** GitHub's Mermaid `classDiagram` parser does not accept unquoted hyphenated CSS property names (`stroke-dasharray`) on `style` directives and threw `Parse error on line 132: ... got 'MINUS'`.
- **Ended up doing:** Removed the invalid `style NotificationService stroke-dasharray: 5 5` line, retained standard `<<planned>>` stereotype notation and dashed dependency arrows (`..>`), and updated all `README.md` diagrams and schema tables to match the codebase to fix the mistake.
