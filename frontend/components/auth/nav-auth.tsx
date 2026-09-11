"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function NavAuth() {
  const { user, loading, refreshAuth } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {user.email}
        </span>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => void refreshAuth({ ensureSignedIn: true })}
      >
        Sign in
      </Button>
    </div>
  );
}
