-- =============================================================================
-- MTVSchool Complete PostgreSQL / Supabase Schema Setup
-- Run this script in the Supabase SQL Editor or via psql to initialize all tables.
-- =============================================================================

-- 1. Users Table (Authentication & Core Identity)
CREATE TABLE IF NOT EXISTS public.users (
    "ID" BIGINT PRIMARY KEY,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Birthday" DATE,
    "Address" TEXT,
    "Role" TEXT NOT NULL CHECK (LOWER("Role") IN ('student', 'teacher', 'parent', 'admin')),
    "Password" TEXT NOT NULL,
    "Email" TEXT
);

-- 2. Teachers Profile Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES public.users("ID") ON DELETE CASCADE
);

-- 3. Students Profile Table (with optional Parent linkage)
CREATE TABLE IF NOT EXISTS public.students (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES public.users("ID") ON DELETE CASCADE,
    parent_id BIGINT REFERENCES public.users("ID") ON DELETE SET NULL
);

-- 4. Classes Table
CREATE TABLE IF NOT EXISTS public.class (
    id BIGSERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE SET NULL,
    room_number INT NOT NULL DEFAULT 0
);

-- 5. Class Enrollments Table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    UNIQUE (class_id, student_id)
);

-- 6. Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id TEXT NOT NULL,
    questions JSONB,
    file TEXT,
    due_date TIMESTAMPTZ NOT NULL
);

-- 7. Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    grade TEXT,
    student_answer JSONB,
    date_submitted TIMESTAMPTZ NOT NULL
);

-- 8. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'tardy')),
    notes TEXT DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (class_id, student_id, date)
);

-- 9. Classroom Seating Assignments Table
CREATE TABLE IF NOT EXISTS public.seating_assignments (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    row_num INT NOT NULL CHECK (row_num >= 1),
    col_num INT NOT NULL CHECK (col_num >= 1),
    UNIQUE (class_id, student_id),
    UNIQUE (class_id, row_num, col_num)
);

-- 10. Class Announcements Table
CREATE TABLE IF NOT EXISTS public.class_announcements (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    "Title" TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
