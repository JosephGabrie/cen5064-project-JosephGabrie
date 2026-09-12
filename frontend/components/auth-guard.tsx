"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SignInPage } from "@/components/sign-in-page";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  // If they are not logged in, show the full screen Sign In page and completely hide the app
  if (!isAuthenticated) {
    return <SignInPage />;
  }

  // Otherwise, render the main application
  return <>{children}</>;
}
