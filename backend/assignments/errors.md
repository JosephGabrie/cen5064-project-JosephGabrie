# Error Report: Assignments Package

## Why there was an error
The IDE reported compilation errors in `assignments/handlers_test.go`:
- `undefined: SetupAssignmentRoutes compiler (UndeclaredName)`
- `undefined: Assignment compiler (UndeclaredName)`

These errors occurred because the test file `handlers_test.go` was attempting to test the `SetupAssignmentRoutes` function and use the `Assignment` struct, but neither of these were defined anywhere in the `assignments` package. Essentially, the test was written before the actual implementation (a Test-Driven Development approach), and the corresponding implementation code was completely missing from the project.

Additionally, `go.mod` had a dependency warning regarding `github.com/golang-jwt/jwt/v5` needing to be a direct dependency.

## What we overlooked
1. **Missing Implementation Code:** The test file was created to validate the routing and request validation logic, but the actual implementation file (`handlers.go`) providing that logic was omitted or never created. 
2. **Missing Struct Definition:** The `Assignment` data model struct, which is fundamental to unmarshaling the JSON payloads in the test suite (e.g., parsing `class_id` and `due_date`), was absent. This caused the Go compiler to immediately fail when evaluating the tests.
3. **Unsynced `go.mod`:** The Go module dependencies were not fully synchronized with the project's actual source code imports, resulting in a dirty module state.

## How we fixed it
1. **Created `handlers.go`**: We added a new `handlers.go` file inside the `assignments` package to house the missing logic.
2. **Defined the `Assignment` Struct**: We defined the struct with the necessary types and JSON struct tags (`id`, `class_id`, and `due_date`) so that `handlers_test.go` could initialize it correctly.
3. **Implemented `SetupAssignmentRoutes`**: We implemented the `SetupAssignmentRoutes(app *fiber.App, db *pgxpool.Pool)` function to register the Fiber routes expected by the test suite:
   - **`POST /api/assignments`**: Added validation logic using Fiber's `c.Bind().JSON()` to verify the body and ensure `class_id` is required. Returns `400 Bad Request` on failure, satisfying `TestPostAssignment_Validation`.
   - **`GET /api/assignments/:id`**: Included a nil-check on the database connection to return a `500 Internal Server Error`, successfully satisfying the mock DB state in `TestGetAssignment_NoID`.
   - **`PUT /api/assignments/:id/due-date`**: Added strict type binding for the `due_date` field (as `time.Time`) to automatically return a `400 Bad Request` if the date format is invalid, successfully resolving `TestPutDueDate_Validation`.
4. **Module Cleanup**: We executed `go mod tidy` in the `backend/` directory to clean up and directly link the `github.com/golang-jwt/jwt/v5` dependency, resolving the go.mod warning.

As a result, all compilation issues were cleared and all tests run smoothly.
