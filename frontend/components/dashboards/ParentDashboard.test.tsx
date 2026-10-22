import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ParentDashboard from './ParentDashboard';

describe('ParentDashboard', () => {
  const mockParentOverview = {
    parent_id: '76633852',
    children: [
      {
        student_id: 1,
        user_id: 438813,
        first_name: 'Sammy',
        last_name: 'Student',
        email: 'sammy@school.edu',
        classes: [
          {
            id: 1,
            name: 'Chemistry',
            subject: 'Science',
            roomNumber: 101,
            teacher: 'Timmy Teacher',
          },
        ],
        submissions: [
          {
            id: 'sub-101',
            class_id: '1',
            student_id: '438813',
            assignment_id: 'assign-1',
            grade: '10',
            date_submitted: '2026-10-20T14:00:00Z',
            student_answer: [{ question_id: 'q1', answer: 'H2O' }],
            feedback: {
              earned_points: 10,
              total_points: 10,
              percentage: 100,
              is_late: false,
              needs_manual_grading: false,
              summary_grade: '10',
              questions: [
                {
                  question_id: 'q1',
                  question_text: 'What is the chemical formula for water?',
                  question_type: 'multiple_choice',
                  student_answer: 'H2O',
                  expected_answer: 'H2O',
                  is_correct: true,
                  needs_review: false,
                  awarded_points: 10,
                  max_points: 10,
                },
              ],
            },
          },
        ],
        attendance_summary: {
          student_id: '438813',
          total_days: 3,
          present_count: 2,
          absent_count: 0,
          tardy_count: 1,
          attendance_rate: 83.3,
          records: [
            {
              id: 'att-1',
              class_id: '1',
              student_id: '438813',
              date: '2026-10-20',
              status: 'present',
              notes: 'On time',
            },
            {
              id: 'att-2',
              class_id: '1',
              student_id: '438813',
              date: '2026-10-19',
              status: 'tardy',
              notes: 'Bus delay',
            },
          ],
        },
        announcements: [
          {
            id: 1,
            class_id: 1,
            title: 'Welcome to Chemistry!',
            content: 'Please review the lab safety syllabus with your child.',
            date: '2026-10-20',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders linked child's grades, attendance summary, and announcements in the Parent Portal", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockParentOverview,
    } as Response);

    render(<ParentDashboard parentId="76633852" />);

    await waitFor(() => {
      expect(screen.getByText(/Parent Portal Dashboard/i)).toBeInTheDocument();
    });

    // Child name & class
    expect(screen.getAllByText(/Sammy Student/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Chemistry/i).length).toBeGreaterThan(0);

    // Child's grades & auto-grading feedback
    expect(screen.getByText(/10 \/ 10 pts/i)).toBeInTheDocument();
    expect(
      screen.getByText(/What is the chemical formula for water\?/i)
    ).toBeInTheDocument();

    // Child's attendance summary (Present, Absent, Tardy) & logs
    expect(screen.getByText(/83.3%/i)).toBeInTheDocument();
    expect(screen.getByText(/Bus delay/i)).toBeInTheDocument();

    // Class announcements
    expect(screen.getByText(/Welcome to Chemistry!/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Please review the lab safety syllabus with your child\./i
      )
    ).toBeInTheDocument();
  });
});
