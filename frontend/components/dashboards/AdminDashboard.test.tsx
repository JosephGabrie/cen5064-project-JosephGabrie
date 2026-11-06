import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminDashboard } from "./AdminDashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: {
      id: "31864322",
      role: "admin",
      firstName: "Alice",
      lastName: "Admin",
      email: "admin@school.edu",
    },
  }),
}));

describe("AdminDashboard", () => {
  const mockMetrics = {
    total_students: 145,
    total_teachers: 18,
    active_classes: 2,
    attendance_rate: 92.5,
    present_today: 35,
    tardy_today: 2,
    absent_today: 3,
    total_recorded_today: 40,
  };

  const mockClasses = [
    {
      id: "1",
      name: "Grade 5 Mathematics",
      subject: "Mathematics",
      room_number: "101",
      teacher_id: "31229834",
      teacher_name: "Timmy Teacher",
      enrolled_count: 1,
      students: [
        {
          student_id: "438813",
          internal_id: "1",
          first_name: "Sammy",
          last_name: "Student",
          email: "sammy@school.edu",
        },
      ],
    },
  ];

  const mockTeachers = [
    {
      id: "1",
      user_id: "31229834",
      first_name: "Timmy",
      last_name: "Teacher",
      email: "timmy@school.edu",
      role: "teacher",
    },
  ];

  const mockStudents = [
    {
      student_id: "438813",
      internal_id: "1",
      first_name: "Sammy",
      last_name: "Student",
      email: "sammy@school.edu",
    },
    {
      student_id: "554433",
      internal_id: "2",
      first_name: "Jordan",
      last_name: "Learner",
      email: "jordan@school.edu",
    },
  ];

  const mockDirectoryUsers = [
    {
      id: "438813",
      first_name: "Sammy",
      last_name: "Student",
      email: "sammy@school.edu",
      role: "student",
      linked_parent_id: "",
    },
    {
      id: "31229834",
      first_name: "Timmy",
      last_name: "Teacher",
      email: "timmy@school.edu",
      role: "teacher",
    },
    {
      id: "76633852",
      first_name: "Patty",
      last_name: "Parent",
      email: "patty@family.org",
      role: "parent",
      linked_student_ids: [],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || "GET";

        if (url.endsWith("/api/admin/metrics")) {
          return {
            ok: true,
            json: async () => mockMetrics,
          } as Response;
        }
        if (url.endsWith("/api/admin/classes") && method === "GET") {
          return {
            ok: true,
            json: async () => mockClasses,
          } as Response;
        }
        if (url.endsWith("/api/admin/teachers")) {
          return {
            ok: true,
            json: async () => mockTeachers,
          } as Response;
        }
        if (url.endsWith("/api/admin/students")) {
          return {
            ok: true,
            json: async () => mockStudents,
          } as Response;
        }
        if (url.endsWith("/api/admin/users") && method === "GET") {
          return {
            ok: true,
            json: async () => mockDirectoryUsers,
          } as Response;
        }
        if (url.endsWith("/api/admin/users") && method === "POST") {
          return {
            ok: true,
            json: async () => ({
              id: "88990011",
              first_name: "Elena",
              last_name: "Rivera",
              email: "elena.rivera@school.edu",
              role: "teacher",
            }),
          } as Response;
        }
        if (url.endsWith("/api/admin/parent-links") && method === "POST") {
          return {
            ok: true,
            json: async () => ({
              status: "linked",
              parent_id: "76633852",
              student_id: "438813",
            }),
          } as Response;
        }
        if (url.endsWith("/api/admin/classes") && method === "POST") {
          return {
            ok: true,
            json: async () => ({
              id: "2",
              name: "Grade 6 Science",
              subject: "Science",
              room_number: "204B",
              teacher_id: "31229834",
              teacher_name: "Timmy Teacher",
              enrolled_count: 0,
              students: [],
            }),
          } as Response;
        }
        if (url.includes("/api/admin/classes/1/enroll") && method === "POST") {
          return {
            ok: true,
            json: async () => ({
              student_id: "554433",
              internal_id: "2",
              first_name: "Jordan",
              last_name: "Learner",
              email: "jordan@school.edu",
            }),
          } as Response;
        }
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      })
    );
  });

  it("renders school-wide overview KPI metrics and scheduled classes", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("kpi-total-students")).toHaveTextContent("145");
    });

    expect(screen.getByTestId("kpi-total-teachers")).toHaveTextContent("18");
    expect(screen.getByTestId("kpi-active-classes")).toHaveTextContent("2");
    expect(screen.getByTestId("kpi-attendance-rate")).toHaveTextContent("92.5%");
    expect(screen.getByText("Grade 5 Mathematics")).toBeInTheDocument();
    expect(screen.getAllByText("Timmy Teacher").length).toBeGreaterThan(0);
  });

  it("allows admin to create a new class section and assign a teacher", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Grade 5 Mathematics")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /create class/i }));

    fireEvent.change(screen.getByLabelText("Class Name"), {
      target: { value: "Grade 6 Science" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Science" },
    });
    fireEvent.change(screen.getByLabelText("Room Number"), {
      target: { value: "204B" },
    });
    fireEvent.change(screen.getByLabelText("Assigned Teacher"), {
      target: { value: "31229834" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save class section/i }));

    await waitFor(() => {
      expect(screen.getByText("Grade 6 Science")).toBeInTheDocument();
    });
  });

  it("allows admin to manage a class roster and enroll a student", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Grade 5 Mathematics")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /manage roster/i }));

    expect(
      screen.getByText(/Manage Class Roster — Grade 5 Mathematics/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Select Student to Enroll"), {
      target: { value: "554433" },
    });

    fireEvent.click(screen.getByRole("button", { name: /enroll student/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Enrolled Jordan Learner successfully/i)
      ).toBeInTheDocument();
    });
  });

  it("filters the User Management Directory by role and search query", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Patty Parent")).toBeInTheDocument();
    });

    // Filter by Parent role
    fireEvent.change(screen.getByTestId("user-role-filter"), {
      target: { value: "parent" },
    });

    expect(screen.getByText("Patty Parent")).toBeInTheDocument();
    expect(screen.queryByText("Sammy Student")).not.toBeInTheDocument();

    // Reset role filter to All and search by email
    fireEvent.change(screen.getByTestId("user-role-filter"), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByTestId("user-search-input"), {
      target: { value: "sammy@school.edu" },
    });

    expect(screen.getByText("Sammy Student")).toBeInTheDocument();
    expect(screen.queryByText("Patty Parent")).not.toBeInTheDocument();
  });

  it("allows admin to create a new user account from the User Directory", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Patty Parent")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("open-create-user-modal"));

    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Elena" },
    });
    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: "Rivera" },
    });
    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "elena.rivera@school.edu" },
    });
    fireEvent.change(screen.getByLabelText("User Role"), {
      target: { value: "teacher" },
    });
    fireEvent.change(screen.getByLabelText("Initial Password"), {
      target: { value: "Secret123!" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create user account/i })
    );

    await waitFor(() => {
      expect(screen.getByText("Elena Rivera")).toBeInTheDocument();
    });
    expect(screen.getByText("elena.rivera@school.edu")).toBeInTheDocument();
  });

  it("allows admin to link a parent account to a student account", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Patty Parent")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("open-link-parent-modal"));

    fireEvent.change(screen.getByLabelText("Select Parent Account"), {
      target: { value: "76633852" },
    });
    fireEvent.change(screen.getByLabelText("Select Student Account"), {
      target: { value: "438813" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /save parent-student link/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Linked parent \(76633852\) to student \(438813\) successfully/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Parent ID: 76633852")).toBeInTheDocument();
    expect(screen.getByText("Linked Children: 438813")).toBeInTheDocument();
  });
});
