"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Megaphone } from "lucide-react";

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
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="rounded-2xl border border-[#679289]/35 bg-white p-6 shadow-sm dark:bg-[#0d2b30]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d7874] text-white">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#071e22] dark:text-white">
                  Class Announcements
                </h1>
                <p className="mt-1 text-sm text-[#071e22]/75 dark:text-[#f8fbfa]/80">
                  Updates, reminders, and notices for Class {classId}.
                </p>
              </div>
            </div>
          </div>

          {canPost && (
            <form
              onSubmit={handleCreateAnnouncement}
              className="rounded-2xl border border-[#679289]/35 bg-white p-6 shadow-sm space-y-4 dark:bg-[#0d2b30]"
            >
              <h2 className="text-lg font-bold text-[#071e22] dark:text-white">
                Post a New Announcement
              </h2>
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#ee2e31]/40 bg-[#ee2e31]/10 p-3 text-sm font-semibold text-[#ee2e31]"
                >
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div
                  role="status"
                  className="rounded-lg border border-[#1d7874]/40 bg-[#1d7874]/10 p-3 text-sm font-semibold text-[#1d7874]"
                >
                  {successMessage}
                </div>
              )}
              <div className="space-y-1.5">
                <label
                  htmlFor="announcement-title"
                  className="block text-sm font-semibold text-[#071e22] dark:text-white"
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
              <div className="space-y-1.5">
                <label
                  htmlFor="announcement-content"
                  className="block text-sm font-semibold text-[#071e22] dark:text-white"
                >
                  Message
                </label>
                <textarea
                  id="announcement-content"
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share details, homework reminders, or study materials with the class..."
                  className="w-full rounded-lg border border-[#679289]/50 bg-white px-3 py-2 text-sm text-[#071e22] shadow-xs focus:border-[#1d7874] focus:outline-none dark:bg-[#071e22] dark:text-white"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1d7874] text-white hover:bg-[#071e22]"
                >
                  {submitting ? "Posting..." : "Post Announcement"}
                </Button>
              </div>
            </form>
          )}

          <div className="rounded-2xl border border-[#679289]/35 bg-white p-6 shadow-sm dark:bg-[#0d2b30]">
            <h2 className="text-lg font-bold text-[#071e22] dark:text-white mb-4">
              Recent Announcements ({announcements.length})
            </h2>
            {loading ? (
              <p className="text-sm text-[#071e22]/70">
                Loading announcements...
              </p>
            ) : announcements.length === 0 ? (
              <p className="text-sm italic text-[#071e22]/60">
                No announcements have been posted for this class yet.
              </p>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="rounded-xl border border-[#679289]/30 bg-[#f8fbfa] p-4 dark:bg-[#071e22]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-[#071e22] dark:text-white">
                        {ann.title}
                      </h3>
                      {ann.date && (
                        <span className="rounded-md bg-[#f4c095]/40 px-2.5 py-0.5 text-xs font-semibold text-[#071e22]">
                          {ann.date}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[#071e22]/85 dark:text-[#f8fbfa]/85 whitespace-pre-wrap">
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
