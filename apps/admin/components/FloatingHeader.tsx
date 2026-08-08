"use client";

import { useEffect, useState } from "react";

interface FloatingHeaderProps {
  userName?: string;
  onSearchChange?: (term: string) => void;
  searchTerm?: string;
  onRegisterClick?: () => void;
}

export function FloatingHeader({
  userName = "Admin",
  onSearchChange,
  searchTerm = "",
  onRegisterClick,
}: FloatingHeaderProps) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute top-4 left-4 z-20 flex items-center gap-3 flex-wrap">
      {/* Brand Badge */}
      <div className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-2xl hover:border-survey/30 transition-all">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 shadow-md shadow-sky-500/20">
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-950 bg-emerald-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.15em] text-survey uppercase">
              COMMAND CENTER
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/25">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-glow-pulse" />
              LIVE
            </span>
          </div>
          <p className="font-display text-sm font-bold text-white tracking-tight">
            {userName}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel hidden sm:flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-xl focus-within:border-survey/50 transition-all w-64 md:w-72">
        <svg className="h-4 w-4 text-survey/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search assets…"
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full bg-transparent text-xs font-medium text-white placeholder-haze/60 outline-none"
        />
        {searchTerm ? (
          <button onClick={() => onSearchChange?.("")} className="text-xs text-haze hover:text-white transition-colors">✕</button>
        ) : (
          <span className="rounded-md bg-ink-800/80 px-1.5 py-0.5 font-mono text-[9px] text-haze/70 border border-white/5">⌘K</span>
        )}
      </div>

      {/* Clock */}
      {clock && (
        <div className="glass-panel hidden lg:flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-haze/80 shadow-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-glow-pulse" />
          {clock}
        </div>
      )}

      {/* Register */}
      {onRegisterClick && (
        <button
          onClick={onRegisterClick}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="text-base leading-none">+</span> Register Asset
        </button>
      )}
    </div>
  );
}
