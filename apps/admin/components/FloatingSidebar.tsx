"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { Manhole, getMe, Technician } from "@/lib/api";
import { StatusPip } from "./StatusPip";

interface FloatingSidebarProps {
  manholes: Manhole[];
  selectedManholeId?: string | null;
  onSelectManhole?: (id: string) => void;
  onRegisterClick?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  utilityFilter?: string | null;
  onUtilityChange?: (utility: string | null) => void;
}

export function FloatingSidebar({
  manholes,
  selectedManholeId,
  onSelectManhole,
  onRegisterClick,
  onRefresh,
  loading = false,
  searchTerm = "",
  onSearchChange,
  utilityFilter = null,
  onUtilityChange,
}: FloatingSidebarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"status" | "manholes">("status");
  const [user, setUser] = useState<Technician | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(console.error);
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  const utilityTypes = ["all", "sewer", "water", "telecom", "electrical"];

  const filteredManholes = manholes.filter((m) => {
    const matchesSearch =
      !searchTerm ||
      m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.utilityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.status?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUtility =
      !utilityFilter ||
      utilityFilter === "all" ||
      m.utilityType === utilityFilter;
    return matchesSearch && matchesUtility;
  });

  return (
    <aside className="glass-panel fixed top-4 right-4 bottom-4 z-20 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col justify-between rounded-3xl p-5 shadow-2xl transition-all">
      {/* 1. Header Profile Box */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-ink-800/60 p-3.5 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold font-display border border-emerald-500/30">
              {user ? user.name.substring(0, 2).toUpperCase() : "..."}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm font-bold text-mist">
                  {user ? user.name : "Loading..."}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="font-mono text-[11px] text-haze flex items-center gap-1">
                <span>⚡</span> Admin Console active
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            title="Refresh assets"
            className="rounded-xl border border-white/10 p-2 text-haze hover:border-survey/40 hover:bg-ink-700 hover:text-survey transition-colors"
          >
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin text-survey" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="flex rounded-xl bg-ink-800/80 p-1 border border-white/5">
          <button
            onClick={() => setActiveTab("status")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              activeTab === "status"
                ? "bg-ink-700 text-mist shadow-md border border-white/10"
                : "text-haze hover:text-mist"
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setActiveTab("manholes")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              activeTab === "manholes"
                ? "bg-ink-700 text-mist shadow-md border border-white/10"
                : "text-haze hover:text-mist"
            }`}
          >
            Manholes ({filteredManholes.length})
          </button>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search code or status..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink-950/60 px-3 py-2 text-xs text-mist placeholder-haze outline-none focus:border-survey/60"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {utilityTypes.map((u) => (
              <button
                key={u}
                onClick={() => onUtilityChange?.(u === "all" ? null : u)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize transition-all shrink-0 ${
                  utilityFilter === u || (u === "all" && !utilityFilter)
                    ? "bg-caution/20 text-caution border border-caution/40"
                    : "bg-ink-800/60 text-haze border border-white/5 hover:text-mist"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Asset Scrollable List */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-380px)] pr-1 space-y-2">
          {filteredManholes.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-center text-xs text-haze">
              No manholes found
            </div>
          ) : (
            filteredManholes.map((m) => {
              const isSelected = m.id === selectedManholeId;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectManhole?.(m.id)}
                  className={`group relative flex flex-col gap-1.5 rounded-xl border p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-survey bg-survey/10 shadow-lg"
                      : "border-white/5 bg-ink-800/40 hover:border-white/20 hover:bg-ink-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-mist group-hover:text-survey transition-colors">
                      {m.code || `MH-${m.id.substring(0, 6)}`}
                    </span>
                    <StatusPip status={m.status} showLabel />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-haze">
                    <span className="capitalize">
                      🔧 {m.utilityType || "unassigned"}
                    </span>
                    <span>
                      📏 {m.depthMeters ? `${m.depthMeters}m` : "N/A"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Bottom Action Area */}
      <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
        >
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
