"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function RoleGuard({
  children,
  allowedRoles
}: {
  children: React.ReactNode,
  allowedRoles: string[]
}) {
  const { user } = useAuth();
  const router = useRouter();

  if (user && !allowedRoles.includes(user.role)) {
    router.push(`/dashboard/${user.role}`);
    return null;
  }
  return <>{children}</>
}
