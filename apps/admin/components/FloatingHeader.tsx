"use client";

interface FloatingHeaderProps {
  userName?: string;
  onSearchChange?: (term: string) => void;
  searchTerm?: string;
}

export function FloatingHeader({ userName = "Jean-Pierre Manga", onSearchChange, searchTerm = "" }: FloatingHeaderProps) {
  return (
    <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
      {/* Welcome Badge Card */}
      <div className="glass-panel flex items-center gap-3.5 rounded-2xl px-4 py-2.5 shadow-xl transition-all hover:border-white/20">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-caution to-amber-300 font-display font-bold text-ink-950 shadow-md">
          {userName.charAt(0)}
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-950 bg-emerald-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-haze">Welcome back</span>
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
              Live
            </span>
          </div>
          <p className="font-display text-sm font-semibold text-mist">
            {userName} 👋
          </p>
        </div>
      </div>

      {/* Quick Search Widget */}
      <div className="glass-panel hidden sm:flex items-center gap-2 rounded-2xl px-3.5 py-2 shadow-xl border border-white/10 focus-within:border-survey/60 transition-all w-64">
        <svg className="h-4 w-4 text-haze shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Filter code, area or type..."
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full bg-transparent text-xs text-mist placeholder-haze/70 outline-none"
        />
        {searchTerm && (
          <button 
            onClick={() => onSearchChange?.("")}
            className="text-xs text-haze hover:text-mist"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
