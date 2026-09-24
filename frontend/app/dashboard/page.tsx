"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  // 1. Added <any[]> so TypeScript knows it's an array of objects
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchClasses = async () => {
      try {
        // 2. Fixed the port from 6760 to 6769 (assuming your Go server is still on 6769!)
        const response = await fetch(`http://localhost:6769/${user.id}/dashboard`);
        const data = await response.json();

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
    <div>
      {classes.map((c) => (
        <div key={c.id}>{c.name}</div>
      ))}
    </div>
  );
}
