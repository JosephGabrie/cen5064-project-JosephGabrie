"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AnnouncementItem {
  id: string;
  class_id: string;
  class_name?: string;
  title: string;
  content: string;
  date: string;
}

export default function AnnouncementsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const canPost = user?.role === "teacher" || user?.role === "admin";

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:6769/api/classes/${classId}/announcements`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAnnouncements(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim() || !content.trim()) {
      setErrorMessage("Please provide both a title and content.");
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(
        `http://localhost:6769/api/classes/${classId}/announcements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            date: today,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to post announcement");
      }

      const created: AnnouncementItem = await res.json();
      setAnnouncements((prev) => [created, ...prev]);
      setTitle("");
      setContent("");
      setSuccessMessage("Announcement posted to the class!");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to post announcement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Class Announcements
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Updates, reminders, and notices for Class {classId}.
            </p>
          </div>

          {canPost && (
            <form
              onSubmit={handleCreateAnnouncement}
              className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 space-y-4 dark:bg-slate-800 dark:border-slate-700"
            >
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Post a New Announcement
              </h2>
              {errorMessage && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
                  {successMessage}
                </div>
              )}
              <div>
                <label
                  htmlFor="announcement-title"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                >
                  Title
                </label>
                <Input
                  id="announcement-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Upcoming Chapter Quiz on Friday"
                />
              </div>
              <div>
                <label
                  htmlFor="announcement-content"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="announcement-content"
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share details, homework reminders, or study materials with the class..."
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Posting..." : "Post Announcement"}
                </Button>
              </div>
            </form>
          )}

          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Recent Announcements ({announcements.length})
            </h2>
            {loading ? (
              <p className="text-sm text-slate-500">Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-slate-500">
                No announcements have been posted for this class yet.
              </p>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {ann.title}
                      </h3>
                      {ann.date && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {ann.date}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
