"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { AlertIcon } from "@/components/Icons";

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
    <div className="relative flex min-h-screen items-center justify-center bg-ink-950 bg-grid-cyber overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-sky-500/8 blur-[100px] animate-ambient" />
      <div className="pointer-events-none absolute -bottom-40 right-20 h-[380px] w-[380px] rounded-full bg-cyan-500/8 blur-[120px] animate-ambient" />
      <div className="pointer-events-none absolute top-1/3 right-1/3 h-64 w-64 rounded-full bg-indigo-500/6 blur-[100px] animate-ambient" />

      <form
        onSubmit={handleSubmit}
        className="glass-panel relative z-10 flex w-full max-w-[420px] flex-col gap-5 rounded-3xl p-8 shadow-2xl border border-white/10"
      >
        {/* Brand Header */}
        <div className="mb-2 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 shadow-lg shadow-sky-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
              {[0,1,2,3,4,5,6,7].map(i => {
                const angle = (i / 8) * Math.PI * 2;
                const x = 12 + Math.cos(angle) * 7.8;
                const y = 12 + Math.sin(angle) * 7.8;
                return <circle key={i} cx={x} cy={y} r="1" fill="currentColor" />;
              })}
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold text-white tracking-tight">
            Manhole Tracker
          </h1>
          <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400">
            COMMAND CENTER
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
            <AlertIcon className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Email */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-haze">Email</span>
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-ink-950/70 px-4 py-2.5 focus-within:border-sky-400/50 transition-all">
            <svg className="h-4 w-4 text-haze shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              className="w-full bg-transparent text-sm text-white placeholder-haze/50 outline-none"
            />
          </div>
        </label>

        {/* Password */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-haze">Password</span>
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-ink-950/70 px-4 py-2.5 focus-within:border-sky-400/50 transition-all">
            <svg className="h-4 w-4 text-haze shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-transparent text-sm text-white placeholder-haze/50 outline-none"
            />
          </div>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Authenticating…" : "Sign In to Dashboard"}
          {!submitting && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </button>

        <p className="text-center text-[10px] text-haze/60 mt-1">
          Authorized personnel only • Admin role required
        </p>
      </form>
    </div>
  );
}
