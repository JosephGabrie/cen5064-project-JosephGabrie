"use client"

import { useAuth } from "@/contexts/AuthContext";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>

  switch (user.role) {
    case "student":
      return <StudentDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <div>Unkown role</div>;
  }

        if (response.ok) {
          setClasses(data);
        } else {
          console.error("failed to fetch classes:", data.error);
        }
      } catch (error) {
        // 3. The catch block was accidentally placed *inside* the try block previously! 
        // We added the closing bracket '}' right above this line to close the try block.
        console.error("Network error:", error);
      }
    }; // 4. Placed a semicolon here to properly close the fetchClasses function

    fetchClasses();
  }, [user]); // 5. Fixed the bracket syntax for the useEffect dependency array

  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
      {classes?.map((c) => (
        <CardImage
          key={c.id}
          id={c.id}
          courseName={c.name}
          subject={c.subject}
          teacher={c.teacher}
          roomNumber={c.roomNumber}
        />
      ))}
    </div>
  );
}
