"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, technician } = await login(email, password);
      if (technician?.role !== "admin") {
        setError("Access denied. Admin privileges required.");
        return;
      }
      setToken(token);
      router.push("/manholes");
    } catch (err: any) {
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Couldn't sign in. Check your email and password.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-ink-700 bg-ink-900/80 p-8"
      >
        <div className="mb-2">
          <p className="font-display text-xl font-700 text-mist">Manhole</p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-caution">
            Admin Console
          </p>
        </div>

        {error && (
          <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-haze">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded border border-ink-700 bg-ink-900 px-3 py-2 text-mist outline-none focus:border-survey"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-haze">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded border border-ink-700 bg-ink-900 px-3 py-2 text-mist outline-none focus:border-survey"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-caution px-4 py-2 text-sm font-semibold text-ink-950 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
