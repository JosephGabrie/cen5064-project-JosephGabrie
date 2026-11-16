"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

export function SignInPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(identifier, password);

    if (!result.success) {
      setError(result.error || "Failed to sign in");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fbfa] p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#679289]/35 bg-white p-6 sm:p-8 shadow-md">
        <div className="mb-8 text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1d7874] text-white shadow-sm"
          >
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#071e22]">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm font-medium text-[#071e22]/70">
            Sign in to your MTV School portal account
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-[#ee2e31]/40 bg-[#ee2e31]/10 p-4 text-center text-sm font-semibold text-[#ee2e31]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="signin-identifier"
              className="block text-sm font-semibold text-[#071e22]"
            >
              Identifier (Email or School ID)
            </label>
            <Input
              id="signin-identifier"
              type="text"
              placeholder="you@example.com or 123456"
              required
              className="h-10 w-full border-[#679289]/50 text-[#071e22]"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="signin-password"
              className="block text-sm font-semibold text-[#071e22]"
            >
              Password
            </label>
            <Input
              id="signin-password"
              type="password"
              placeholder="••••••••"
              required
              className="h-10 w-full border-[#679289]/50 text-[#071e22]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full bg-[#1d7874] text-white hover:bg-[#071e22] text-base font-bold shadow-sm"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
