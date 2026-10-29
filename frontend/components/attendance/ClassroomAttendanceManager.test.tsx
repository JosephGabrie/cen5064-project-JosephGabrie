import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClassroomAttendanceManager from './ClassroomAttendanceManager';

describe('ClassroomAttendanceManager', () => {
  const mockStudents = [
    {
      student_id: 1,
      user_id: 438813,
      first_name: 'Sammy',
      last_name: 'Student',
      email: 'sammy@school.edu',
    },
  ];

  const mockSeating = [
    {
      id: 10,
      class_id: 1,
      student_id: 438813,
      row: 0,
      col: 0,
      first_name: 'Sammy',
      last_name: 'Student',
    },
  ];

  const mockLogs = [
    {
      date: '2026-10-20',
      total_students: 1,
      present_count: 1,
      absent_count: 0,
      tardy_count: 0,
      records: [
        {
          id: 'att-1',
          class_id: '1',
          student_id: '438813',
          date: '2026-10-20',
          status: 'present',
          notes: 'On time',
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders classroom seating arrangement, student attendance controls (present, absent, tardy), and daily logs for a teacher', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/students')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockStudents,
        } as Response);
      }
      if (url.includes('/seating')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSeating,
        } as Response);
      }
      if (url.includes('/attendance/logs')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockLogs,
        } as Response);
      }
      if (url.includes('/attendance')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockLogs[0].records,
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => [] } as Response);
    });

    render(
      <ClassroomAttendanceManager
        classId="1"
        userRole="teacher"
        userId="31229834"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Sammy Student/i).length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(/Classroom Seating Arrangement/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Daily Attendance Roster/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Daily Attendance Logs/i })
    ).toBeInTheDocument();

    // Mark Sammy Student as Tardy and save attendance
    const tardyButtons = screen.getAllByRole('button', { name: /^Tardy$/i });
    expect(tardyButtons.length).toBeGreaterThan(0);
    fireEvent.click(tardyButtons[0]);

    const saveAttendanceBtn = screen.getByRole('button', {
      name: /Save Attendance/i,
    });
    fireEvent.click(saveAttendanceBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Attendance saved successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('allows teachers to save updated seating arrangements', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/students')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockStudents,
        } as Response);
      }
      if (url.includes('/seating')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSeating,
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => [] } as Response);
    });

    render(
      <ClassroomAttendanceManager
        classId="1"
        userRole="teacher"
        userId="31229834"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Save Seating Arrangement/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Save Seating Arrangement/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Seating arrangement saved successfully/i)
      ).toBeInTheDocument();
    });
  });
});
