# [School Information System]

<!-- CI badge: after Session 4, replace ORG/REPO and the workflow filename, then uncomment:
![CI](https://github.com/ORG/REPO/actions/workflows/ci.yml/badge.svg)
-->

**Student:** Joseph Gabrie · **Course:** CEN 5064 Software Design, Fall 2026 · **Partner:** @Jesse-Trueba

## Project (approval paragraph — write this by Sun Aug 30)

My project is a school information system (SIS) built for a k-8 school. 
The features that it needs to have are:
1. AI submission detection System
2. Attendance system
3. Assignment/Quiz system
4. Notification System

My tech stack uses Next.js (React) for my FrontEnd, Golang for my backend, and Supabase for my Database.
## How to run

```
# Terminal 1: Backend
cd backend
# Ensure .env is set with SUPABASE_CONNECTION_STRING
go run ./main/main.go

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

Log in student
438813
041210SS

Log in teacher
31229834
082580TT

Log in Admin
31864322
113075AA

```

## Architecture
### Tier breakdown (Session 2 studio)

| Tier | What it does in THIS system | Folders & Files |
|---|---|---|
| **Presentation** | Renders user interfaces and handles user interactions for students, teachers, parents, and administrators. Manages client-side routing, form state, and authentication context. Displays role-based dashboards, class schedules, assignments, submissions, and grades. | `frontend/app/` (pages & layouts: `page.tsx`, `profile/page.tsx`, `calendar/page.tsx`, `class/[classId]/page.tsx`, `teacher/assignments/`), `frontend/components/dashboards/` (`AdminDashboard.tsx`, `TeacherDashboard.tsx`, `StudentDashboard.tsx`), `frontend/components/assignments/` (`CreateAssignmentForm.tsx`), `frontend/components/ui/` (Shadcn UI components: `button.tsx`, `card.tsx`, `sidebar.tsx`), `frontend/components/` (`auth-guard.tsx`, `role-guard.tsx`, `class-card.tsx`, `app-sidebar.tsx`), `frontend/contexts/AuthContext.tsx` |
| **Service** | Orchestrates application workflow, handles incoming HTTP REST API requests, validates request payloads, manages authentication/JWT authorization tokens, and coordinates interactions between domain logic and the database. Exposes endpoints for user login, class rosters, assignment creation/retrieval/updates, and submission intake. | `backend/main/main.go` (Fiber server setup, CORS, route registration), `backend/auth/signIn.go` (HTTP endpoint `POST /api/login/`, JWT creation), `backend/auth/middleware.go` (route authorization checks), `backend/api/handler.go` (dashboard endpoints `GET :userId/dashboard`), `backend/assignments/handlers.go` (REST handlers: `postAssignment`, `getAssignment`, `putAssignment`, `putDueDate`, `postSubmission`, `getSubmission`, `getUserAssignments`, `getClassAssignments`) |
| **Domain** | Encapsulates core school business rules, grading policies, and entity models independently of HTTP transport or database storage. Enforces grading logic: auto-grades objective questions (multiple choice, true/false, fill-in-the-blank), assigns a grade of `0` to late submissions submitted past the deadline, and flags free-form or file-based submissions as "Needs Manual Grading". | `backend/assignments/grading.go` — Contains `GradeAssignment()`: Implements core business grading rules for evaluating student submissions against assignment deadlines and questions.<br>`backend/assignments/grading_test.go` (Pure unit tests verifying grading business rules without DB/network mocks), `backend/assignments/models.go` (Domain models: `Assignment`, `Question`, `Submission`, `StudentAnswer`), `backend/auth/signIn.go` (`VerifyPassword()` bcrypt check) |
| **Data** | Manages persistent data storage, database connection pooling, schema migrations, table constraints, and SQL queries for users, classes, enrollments, assignments, and submissions. Connects to hosted PostgreSQL on Supabase via `pgxpool`. | Supabase Cloud Database (PostgreSQL database & assignment file storage buckets), `backend/main/main.go` (`connect()` initializing `pgxpool.Pool` via `SUPABASE_CONNECTION_STRING`), `backend/init_assignments.sql` (schema definitions for `assignments` and `submissions`), SQL queries in `backend/assignments/handlers.go`, `backend/api/handler.go`, and `backend/auth/signIn.go`, `.env` (`SUPABASE_CONNECTION_STRING`) |

### C4 — Context & Container (Session 3 studio)
```mermaid
flowchart TB
    %% Users / Actors (Represented as pills/ovals)
    Student(["Student <br/>Views grades, schedules, and attendance"])
    Teacher(["Teacher<br/>Inputs grades, takes attendance, manages classes"])
    Parent(["Parent<br/>Monitors student progress and pays fees"])
    Admin(["Administrator<br/>Manages users, schedules, and school ops"])

    %% The Core System (Represented as a prominent rectangle)
    SIS["School Information System (SIS)<br/>[Software System]<br/>The core system that stores and manages all school, user, and academic data."]

    %% External Systems (Represented as standard rectangles)
    Email["Notification Service<br/>[External System]<br/>Sends email and SMS alerts"]

    %% Connections (Users to System)
    Admin -- "Manages system" --> SIS
    Teacher -- "Updates academic data" --> SIS
    Student -- "Views academic data" --> SIS
    Parent -- "Monitors progress & pays fees" --> SIS

    %% Connections (System to External Systems)
    SIS -- "Dispatches alerts through" --> Email
```

```mermaid
%% Container view: your containers should match the tier table above.
flowchart TB
    Users([Students, Teachers, Parents, Admins]) --> |Interact via browser| ui

    subgraph SIS [School Information System]
        ui["Web UI (Presentation Tier)<br/>Present classes, show grades, show student attendance"] 
        
        api["Application API (Service Tier)<br/>Submit assignments, announcements, user role routing"]
        
        domain["Business Logic (Domain Tier)<br/>Grade scales, prerequisite checks, time overlap rules"]
        
        db[("Supabase Database (Data Tier)<br/>Store assignments, grades, user info")]

        ui -->|API Calls| api
        api -->|Validates actions against| domain
        domain -->|Reads/Writes| db
    end
```

### UML — Class & Sequence (Session 3 studio)

```mermaid
%% Class diagram: core domain classes.
classDiagram
    class User {
        +string ID
        +string FirstName
        +string LastName
        +string Role
        +string Email
        +Login(identifier, password)
    }

    class Class {
        +string ID
        +string Name
        +string Teacher
        +string RoomNumber
        +string Subject
        +GetUserClasses(userId)
    }

    class Assignment {
        +string ID
        +string ClassID
        +string File
        +time.Time DueDate
        +PostAssignment()
        +PutDueDate()
    }

    class Question {
        +string ID
        +string Question
        +string Answer
        +int Points
        +string Type
        +string[] Options
    }

    class Submission {
        +string ID
        +string ClassID
        +string StudentID
        +string AssignmentID
        +string Grade
        +time.Time DateSubmitted
        +GradeAssignment()
    }

    User "1" --> "*" Class : teaches or enrolled in
    Class "1" --> "*" Assignment : contains
    Assignment "1" *-- "*" Question : composed of
    User "1" --> "*" Submission : submits
    Assignment "1" --> "*" Submission : receives
```

```mermaid
%% Sequence diagram: ONE core use case, end to end.
sequenceDiagram
    actor T as Teacher
    participant UI as Next.js Frontend
    participant S as Go Backend
    participant D as Supabase (PostgreSQL)
    T->>UI: Submits Create Assignment Form
    UI->>S: POST /api/assignments
    S->>D: INSERT INTO assignments
    D-->>S: Success (UUID returned)
    S-->>UI: 201 Created
    UI-->>T: Assignment created confirmation
```

## Architecture Decision Records

Decisions live in [`docs/adr/`](docs/adr/). Start with ADR-001 in Session 4.

| # | Decision | Status |
|---|----------|--------|
| [001](docs/adr/adr-001.md) | Architecture and Tech Stack Selection for K-8 School Information System | accepted |
| [002](docs/adr/adr-002.md) | Data Storage Choice: Transition from Local PostgreSQL to Supabase | accepted |

## Weekly log (optional but recommended)

A one-line note per week keeps your commit story readable:

- Week 1 (Aug 24): repo created, three ideas drafted
- Week 2 (Aug 31): initial structure
- September 21: Working on user dashboard
- October 2: Created a page for each class and fixed routing issues
- October 6: Attached assignment creation tool to teacher class assignments section and fixed assignment form bugs
