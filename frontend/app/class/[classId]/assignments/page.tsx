"use client";

import React, { use, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/AuthContext";
import CreateAssignmentForm from "@/components/assignments/CreateAssignmentForm";
import { Button } from "@/components/ui/button";

interface Assignment {
  id: string;
  class_id: string;
  due_date: string;
  file?: string;
  questions?: any[];
}

export default function AssignmentsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const fetchAssignments = () => {
    fetch(`http://localhost:6769/api/classes/${classId}/assignments`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAssignments(data);
        }
      })
      .catch((err) => console.error("Error fetching assignments:", err));
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  const now = new Date();
  const activeAssignments = assignments.filter((a) => new Date(a.due_date) >= now);
  const pastAssignments = assignments.filter((a) => new Date(a.due_date) < now);

  const handleEditClick = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setViewMode('edit');
  };

  const handleSuccess = () => {
    setViewMode('list');
    setEditingAssignment(null);
    fetchAssignments();
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingAssignment(null);
  };

  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-start min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
        <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-md dark:bg-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Assignments
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Class {classId}
              </p>
            </div>
            {viewMode === 'list' && user?.role === 'teacher' && (
              <Button onClick={() => setViewMode('create')}>
                + Create Assignment
              </Button>
            )}
          </div>
          
          {viewMode === 'list' && (
            <div className="space-y-10">
              {/* Active Assignments */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 border-b pb-2">Active Assignments</h2>
                {activeAssignments.length === 0 ? (
                  <p className="text-slate-500 italic">No active assignments.</p>
                ) : (
                  <div className="grid gap-4">
                    {activeAssignments.map(a => (
                      <div key={a.id} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm flex items-center justify-between hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                        <div>
                          <div className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-md inline-block mb-2">
                            {a.file ? "File Upload" : "Questions"}
                          </div>
                          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Assignment</h3>
                          <p className="text-sm text-slate-500 mt-1">Due: {new Date(a.due_date).toLocaleString()}</p>
                        </div>
                        {user?.role === 'teacher' && (
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(a)}>
                            Edit
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Due Assignments */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 border-b pb-2">Past Due</h2>
                {pastAssignments.length === 0 ? (
                  <p className="text-slate-500 italic">No past assignments.</p>
                ) : (
                  <div className="grid gap-4 opacity-75">
                    {pastAssignments.map(a => (
                      <div key={a.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 shadow-sm flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
                        <div>
                          <div className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded-md inline-block mb-2">
                            {a.file ? "File Upload" : "Questions"}
                          </div>
                          <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300">Assignment</h3>
                          <p className="text-sm text-red-500 mt-1 font-medium">Due: {new Date(a.due_date).toLocaleString()}</p>
                        </div>
                        {/* Teachers can still edit past due if needed, but usually it's closed. We'll leave it out or optional. Let's include it for flexibility. */}
                        {user?.role === 'teacher' && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(a)}>
                            Edit
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === 'create' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CreateAssignmentForm classId={classId} onSuccess={handleSuccess} onCancel={handleCancel} />
            </div>
          )}

          {viewMode === 'edit' && editingAssignment && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CreateAssignmentForm classId={classId} initialData={editingAssignment} onSuccess={handleSuccess} onCancel={handleCancel} />
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
