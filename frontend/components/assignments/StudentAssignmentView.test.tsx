import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentAssignmentView, { AssignmentData } from './StudentAssignmentView';

describe('StudentAssignmentView', () => {
  const sampleAssignment: AssignmentData = {
    id: 'assign-101',
    class_id: '1',
    due_date: '2026-12-31T23:59:00Z',
    questions: [
      {
        id: 'q1',
        question: 'What is the chemical symbol for water?',
        type: 'multiple_choice',
        points: 5,
        options: ['H2O', 'CO2', 'O2'],
        answer: 'H2O',
      },
      {
        id: 'q2',
        question: 'Atoms are the basic building blocks of matter.',
        type: 'true_false',
        points: 5,
        answer: 'true',
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders assignment questions and options for the student to view and answer', () => {
    render(
      <StudentAssignmentView
        assignment={sampleAssignment}
        studentId="438813"
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText(/What is the chemical symbol for water\?/i)).toBeInTheDocument();
    expect(screen.getByText('H2O')).toBeInTheDocument();
    expect(screen.getByText('CO2')).toBeInTheDocument();
    expect(screen.getByText(/Atoms are the basic building blocks of matter\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Assignment/i })).toBeInTheDocument();
  });

  it('submits answers and displays instant auto-grading feedback', async () => {
    const mockSubmissionResponse = {
      id: 'sub-555',
      class_id: '1',
      student_id: '438813',
      assignment_id: 'assign-101',
      grade: '10',
      date_submitted: '2026-10-20T18:00:00Z',
      student_answer: [
        { question_id: 'q1', answer: 'H2O' },
        { question_id: 'q2', answer: 'true' },
      ],
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
            question_text: 'What is the chemical symbol for water?',
            question_type: 'multiple_choice',
            student_answer: 'H2O',
            expected_answer: 'H2O',
            is_correct: true,
            needs_review: false,
            awarded_points: 5,
            max_points: 5,
          },
          {
            question_id: 'q2',
            question_text: 'Atoms are the basic building blocks of matter.',
            question_type: 'true_false',
            student_answer: 'true',
            expected_answer: 'true',
            is_correct: true,
            needs_review: false,
            awarded_points: 5,
            max_points: 5,
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSubmissionResponse,
    } as Response);

    const onSubmittedMock = vi.fn();

    render(
      <StudentAssignmentView
        assignment={sampleAssignment}
        studentId="438813"
        onBack={vi.fn()}
        onSubmitted={onSubmittedMock}
      />
    );

    fireEvent.click(screen.getByLabelText('H2O'));
    fireEvent.click(screen.getByLabelText('True'));
    fireEvent.click(screen.getByRole('button', { name: /Submit Assignment/i }));

    await waitFor(() => {
      expect(screen.getByText(/Instant Auto-Grading Feedback/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/10 \/ 10 pts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/100%/i).length).toBeGreaterThan(0);
    expect(onSubmittedMock).toHaveBeenCalledTimes(1);
  });
});
