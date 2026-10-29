'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface QuestionItemData {
  id: string;
  question: string;
  answer?: string;
  points: number;
  type: 'multiple_choice' | 'free_form' | 'fill_in_the_blank' | 'true_false';
  options?: string[];
}

export interface AssignmentData {
  id: string;
  class_id: string;
  due_date: string;
  file?: string;
  questions?: QuestionItemData[];
}

export interface QuestionFeedbackData {
  question_id: string;
  question_text: string;
  question_type: string;
  student_answer: string;
  expected_answer?: string;
  is_correct: boolean;
  needs_review: boolean;
  awarded_points: number;
  max_points: number;
}

export interface SubmissionFeedbackData {
  earned_points: number;
  total_points: number;
  percentage: number;
  is_late: boolean;
  needs_manual_grading: boolean;
  summary_grade: string;
  questions: QuestionFeedbackData[];
}

export interface SubmissionData {
  id: string;
  class_id: string;
  student_id: string;
  assignment_id: string;
  grade: string;
  student_answer: { question_id: string; answer: string }[];
  date_submitted: string;
  feedback?: SubmissionFeedbackData;
}

interface StudentAssignmentViewProps {
  assignment: AssignmentData;
  studentId: string;
  existingSubmission?: SubmissionData | null;
  readOnly?: boolean;
  onBack: () => void;
  onSubmitted?: (submission: SubmissionData) => void;
}

function buildFallbackFeedback(
  assignment: AssignmentData,
  submission: SubmissionData,
): SubmissionFeedbackData {
  if (submission.feedback) {
    return submission.feedback;
  }

  const questions = assignment.questions || [];
  const answerMap = new Map<string, string>();
  (submission.student_answer || []).forEach((sa) => {
    answerMap.set(sa.question_id, sa.answer);
  });

  const isLate =
    Boolean(assignment.due_date) &&
    new Date(submission.date_submitted) > new Date(assignment.due_date);

  let earnedPoints = 0;
  let totalPoints = 0;
  let needsManual = Boolean(assignment.file && questions.length === 0);

  const qFeedbacks: QuestionFeedbackData[] = questions.map((q) => {
    totalPoints += q.points;
    const studentAns = answerMap.get(q.id) || '';
    const isFreeForm = q.type === 'free_form';
    if (isFreeForm) {
      needsManual = true;
    }
    const matched =
      !isFreeForm &&
      studentAns.trim() !== '' &&
      studentAns.trim().toLowerCase() === (q.answer || '').trim().toLowerCase();
    const awarded = matched && !isLate ? q.points : 0;
    earnedPoints += awarded;

    return {
      question_id: q.id,
      question_text: q.question,
      question_type: q.type,
      student_answer: studentAns,
      expected_answer: q.answer,
      is_correct: matched,
      needs_review: isFreeForm,
      awarded_points: awarded,
      max_points: q.points,
    };
  });

  if (isLate) {
    earnedPoints = 0;
  }

  const percentage =
    totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 1000) / 10 : 0;

  return {
    earned_points: earnedPoints,
    total_points: totalPoints,
    percentage,
    is_late: isLate,
    needs_manual_grading: needsManual,
    summary_grade: submission.grade,
    questions: qFeedbacks,
  };
}

export default function StudentAssignmentView({
  assignment,
  studentId,
  existingSubmission = null,
  readOnly = false,
  onBack,
  onSubmitted,
}: StudentAssignmentViewProps) {
  const [submission, setSubmission] = useState<SubmissionData | null>(existingSubmission);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (existingSubmission?.student_answer) {
      existingSubmission.student_answer.forEach((sa) => {
        initial[sa.question_id] = sa.answer;
      });
    }
    return initial;
  });
  const [fileResponse, setFileResponse] = useState<string>(() => {
    const fileAns = existingSubmission?.student_answer?.find(
      (sa) => sa.question_id === 'file_submission',
    );
    return fileAns?.answer || '';
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const questions = assignment.questions || [];
  const isFileAssignment = Boolean(assignment.file && questions.length === 0);
  const totalPossiblePoints = useMemo(
    () => questions.reduce((acc, q) => acc + (q.points || 0), 0),
    [questions],
  );

  const feedback = useMemo(() => {
    if (!submission) return null;
    return buildFallbackFeedback(assignment, submission);
  }, [assignment, submission]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const studentAnswerArray = isFileAssignment
        ? [{ question_id: 'file_submission', answer: fileResponse }]
        : questions.map((q) => ({
            question_id: q.id,
            answer: answers[q.id] || '',
          }));

      const payload = {
        class_id: assignment.class_id,
        student_id: studentId,
        assignment_id: assignment.id,
        student_answer: studentAnswerArray,
      };

      const response = await fetch('http://localhost:6769/api/submissions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit assignment');
      }

      const savedSub: SubmissionData = await response.json();
      setSubmission(savedSub);
      if (onSubmitted) {
        onSubmitted(savedSub);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error while submitting.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = Boolean(submission) || readOnly;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div>
          <span className="inline-block rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {isFileAssignment ? 'File Upload Assignment' : `Quiz / Questions (${questions.length})`}
          </span>
          <h2 className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">
            {isFileAssignment ? 'File Assignment Details' : 'Assignment Questions & Workspace'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Due: {new Date(assignment.due_date).toLocaleString()}
            {totalPossiblePoints > 0 && ` • Total Points: ${totalPossiblePoints} pts`}
          </p>
        </div>
        <Button variant="outline" type="button" onClick={onBack}>
          ← Back to Assignments
        </Button>
      </div>

      {/* Instant Auto-Grading Feedback Banner */}
      {submission && feedback && (
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/70 p-6 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Instant Auto-Grading Feedback
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {feedback.needs_manual_grading && submission.grade === 'Needs Manual Grading'
                  ? 'Submitted — Pending Teacher Review'
                  : feedback.is_late
                    ? 'Late Submission (0 pts)'
                    : `Auto-Graded Score: ${feedback.earned_points} / ${feedback.total_points} pts (${feedback.percentage}%)`}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Submitted on {new Date(submission.date_submitted).toLocaleString()} • Recorded Grade:{' '}
                <span className="font-semibold">{submission.grade}</span>
              </p>
            </div>

            {!feedback.needs_manual_grading && feedback.total_points > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                  {feedback.percentage}%
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {feedback.earned_points} of {feedback.total_points} points earned
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Assignment Contents */}
        {assignment.file && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Assignment Resource / Prompt File
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Your teacher has attached the following resource link for this assignment:
            </p>
            <div className="mt-3">
              <a
                href={assignment.file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Open Assignment Resource ({assignment.file})
              </a>
            </div>

            {isFileAssignment && (
              <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
                <label
                  htmlFor="file-submission-input"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Your Submission Link or Written Response
                </label>
                <Input
                  id="file-submission-input"
                  placeholder="Paste link to your completed document or enter your response..."
                  value={fileResponse}
                  onChange={(e) => setFileResponse(e.target.value)}
                  disabled={isLocked}
                />
              </div>
            )}
          </div>
        )}

        {/* Questions Contents */}
        {questions.length > 0 && (
          <div className="space-y-5">
            {questions.map((q, idx) => {
              const qFb = feedback?.questions?.find((item) => item.question_id === q.id);
              const currentVal = answers[q.id] || '';

              return (
                <div
                  key={q.id || idx}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {idx + 1}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {q.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {q.points} {q.points === 1 ? 'pt' : 'pts'}
                    </span>
                  </div>

                  <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                    {q.question}
                  </p>

                  {/* Question Input Controls */}
                  <div className="mt-4 space-y-2.5">
                    {q.type === 'multiple_choice' && (
                      <div className="grid gap-2">
                        {(q.options || []).map((opt, optIdx) => {
                          const inputId = `q-${q.id}-opt-${optIdx}`;
                          return (
                            <label
                              key={inputId}
                              htmlFor={inputId}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                                currentVal === opt
                                  ? 'border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-900/20'
                                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50'
                              }`}
                            >
                              <input
                                id={inputId}
                                type="radio"
                                name={`question-${q.id}`}
                                value={opt}
                                checked={currentVal === opt}
                                onChange={() => handleAnswerChange(q.id, opt)}
                                disabled={isLocked}
                                className="h-4 w-4 text-blue-600"
                              />
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {opt}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="flex gap-4">
                        {(['true', 'false'] as const).map((tfVal) => {
                          const inputId = `q-${q.id}-${tfVal}`;
                          const labelText = tfVal === 'true' ? 'True' : 'False';
                          return (
                            <label
                              key={inputId}
                              htmlFor={inputId}
                              className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-2.5 transition-colors ${
                                currentVal.toLowerCase() === tfVal
                                  ? 'border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-900/20'
                                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700'
                              }`}
                            >
                              <input
                                id={inputId}
                                type="radio"
                                name={`question-${q.id}`}
                                value={tfVal}
                                checked={currentVal.toLowerCase() === tfVal}
                                onChange={() => handleAnswerChange(q.id, tfVal)}
                                disabled={isLocked}
                                className="h-4 w-4 text-blue-600"
                              />
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {labelText}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'fill_in_the_blank' && (
                      <Input
                        placeholder="Type your answer here..."
                        value={currentVal}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        disabled={isLocked}
                      />
                    )}

                    {q.type === 'free_form' && (
                      <textarea
                        rows={4}
                        placeholder="Write your response here..."
                        value={currentVal}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        disabled={isLocked}
                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    )}
                  </div>

                  {/* Per-Question Instant Feedback */}
                  {qFb && (
                    <div
                      className={`mt-4 rounded-lg border p-3.5 text-sm ${
                        qFb.needs_review
                          ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                          : qFb.is_correct
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>
                          {qFb.needs_review
                            ? 'Pending Manual Teacher Grading'
                            : qFb.is_correct
                              ? '✓ Correct Answer!'
                              : '✗ Incorrect Answer'}
                        </span>
                        <span>
                          {qFb.needs_review
                            ? `— / ${qFb.max_points} pts`
                            : `${qFb.awarded_points} / ${qFb.max_points} pts`}
                        </span>
                      </div>
                      {!qFb.needs_review && !qFb.is_correct && qFb.expected_answer && (
                        <p className="mt-1 text-xs">
                          Expected Correct Answer:{' '}
                          <span className="font-bold">{qFb.expected_answer}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        {!isLocked && (
          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg" disabled={isSubmitting} className="px-8">
              {isSubmitting ? 'Submitting & Grading...' : 'Submit Assignment'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
