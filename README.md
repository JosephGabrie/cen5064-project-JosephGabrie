# [School Information System]

<!-- CI badge: after Session 4, replace ORG/REPO and the workflow filename, then uncomment:
![CI](https://github.com/ORG/REPO/actions/workflows/ci.yml/badge.svg)
-->

**Student:** Joseph Gabrie · **Course:** CEN 5064 Software Design, Fall 2026 · **Partner:** @Jesse-Trueba

## Project (approval paragraph — write this by Sun Aug 30)

My project is a school information system(ISS) built for a k-8 school. 
The features that it needs to have are:
1. AI submission detection System
2. Attendance system
3. Assignmnet/Quiz system
4. Notification System

My tech stack will be to use React for my FrontEnd, Golang for my backend, and MySQL for my Database.
## How to run

```
[Exact commands to build and run your system from a clean clone.
Update this every time the steps change — your partner and your
instructor will follow it literally on conference days.]
```

## Architecture
### Tier breakdown (Session 2 studio)

| Tier | Responsibilities in THIS system |
|---|---|
| **Presentation** | Present classes, show grades, show student attendance. |
| **Service** | Create/submit an assignment, create a class announcement, view grades, direct user to their respective page depending if they are a parent, teacher, student, or admin. |
| **Domain** | Define grade scales (e.g., A: 100 - 90, B: 89 - 80), ensure students cannot have two classes that overlap in time, prevent students from taking classes without meeting prerequisites. |
| **Data** | Store assignments, grades, user info, etc., in the postgresql database. |

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
        
        db[("PostgreSQL Database (Data Tier)<br/>Store assignments, grades, user info")]

        ui -->|API Calls| api
        api -->|Validates actions against| domain
        domain -->|Reads/Writes| db
    end
```

### UML — Class & Sequence (Session 3 studio)

```mermaid
%% Class diagram: your 3–4 core domain classes.
classDiagram
    class ExampleEntity {
        -id: Long
        -name: String
        +doSomething()
    }
```

```mermaid
%% Sequence diagram: ONE core use case, end to end.
sequenceDiagram
    actor U as User
    participant UI
    participant S as Service
    participant D as Data
    U->>UI: action
    UI->>S: request
    S->>D: save/load
    D-->>S: result
    S-->>UI: response
    UI-->>U: confirmation
```

## Architecture Decision Records

Decisions live in [`docs/adr/`](docs/adr/). Start with ADR-001 in Session 4.

| # | Decision | Status |
|---|----------|--------|
| [001](docs/adr/adr-001.md) | [What I am building and why] | [proposed] |

## Weekly log (optional but recommended)

A one-line note per week keeps your commit story readable:

- Week 1 (Aug 24): repo created, three ideas drafted
- Week 2 (Aug 31): ...
- September 21: Working on user dashboard
  
