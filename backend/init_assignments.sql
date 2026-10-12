CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id TEXT NOT NULL,
    questions JSONB,
    file TEXT,
    due_date TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    grade TEXT,
    student_answer JSONB,
    date_submitted TIMESTAMPTZ NOT NULL
);
