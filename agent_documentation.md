# Agent Documentation

## Assignment and Submission System Implementation

**What was done:**
- Implemented the database structure (structs) for Assignments and Submissions.
- Implemented `GradeAssignment` which handles auto-grading logic, marking late submissions as `0`, and flagging free-form or file-based answers as `Needs Manual Grading`.
- Created Fiber handlers `PostAssignment`, `GetAssignment`, `PutDueDate`, `PostSubmission`, and `GetSubmission` mimicking a REST API behavior to process these objects and persist them via `pgxpool`.
- Added React Hook Form implementation for Teacher UI `CreateAssignmentForm` following Shadcn UI patterns and zod validation schema.
- Added Next.js Teacher page route `/teacher/assignments/create`.
- Adhered strictly to TDD for both frontend (using Vitest) and backend (using Go's built in testing). Test coverage spans input validation, edge cases (such as time logic), and logic extraction.

**The Intent:**
- **Go Backend:** We encapsulate grading logic into its own pure function `GradeAssignment` rather than entangling it within Fiber handlers. This permits fast TDD cycles without requiring a fully spun-up database or HTTP mocking. This architectural decision satisfies Effective Go's guidance on testable components.
- **Next.js Frontend:** React Hook Forms coupled with Zod ensures reliable client-side validation while minimizing unneeded re-renders on every keystroke. Using standard semantic elements structured similarly to Shadcn UI enables easy custom styling or future direct component swaps while maintaining accessibility.
