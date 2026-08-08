"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { Manhole, getMe, Technician } from "@/lib/api";
import { StatusPip } from "./StatusPip";
import {
  UsersIcon,
  ClipboardIcon,
  RefreshIcon,
  SignOutIcon,
  ShieldIcon,
  UtilityIcon,
  RulerIcon,
  MapIcon,
} from "./Icons";

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
  onRefresh,
  loading = false,
  searchTerm = "",
  onSearchChange,
  utilityFilter = null,
  onUtilityChange,
}: FloatingSidebarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"assets" | "status">("assets");
  const [user, setUser] = useState<Technician | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(console.error);
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  const utilityTypes = ["all", "telecom", "sewer", "water", "electrical"];

  const filteredManholes = manholes.filter((m) => {
    const matchesSearch =
      !searchTerm ||
      m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.utilityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.status?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUtility =
      !utilityFilter || utilityFilter === "all" || m.utilityType === utilityFilter;
    return matchesSearch && matchesUtility;
  });

  return (
    <aside className="glass-panel fixed top-4 right-4 bottom-4 z-20 flex w-[380px] max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex-col justify-between rounded-3xl p-5 shadow-2xl overflow-hidden transition-all">
      {/* Top Main Section */}
      <div className="flex flex-col gap-3.5 flex-1 min-h-0 overflow-hidden">
        {/* User Profile Banner */}
        <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-ink-900/70 p-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 font-bold font-display border border-sky-500/25 shadow-md shadow-sky-500/10">
              {user ? user.name.substring(0, 2).toUpperCase() : "··"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm font-bold text-white">{user?.name || "Loading…"}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="font-mono text-[10px] text-haze/70 flex items-center gap-1">
                <ShieldIcon className="h-3 w-3 text-sky-400 inline" /> Admin Console
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            title="Refresh assets"
            className="rounded-xl border border-white/8 p-2 text-haze hover:border-sky-400/40 hover:text-sky-400 hover:bg-ink-800/50 transition-all active:scale-90"
          >
            <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin text-sky-400" : ""}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-ink-950/80 p-1 border border-white/5 shrink-0">
          {(["assets", "status"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/15"
                  : "text-haze hover:text-white"
              }`}
            >
              {tab === "assets" ? `Assets (${filteredManholes.length})` : "Status"}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-2 shrink-0">
          <input
            type="text"
            placeholder="Search code, status, utility…"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-xl border border-white/8 bg-ink-950/60 px-3.5 py-2 text-xs text-white placeholder-haze/50 outline-none focus:border-sky-400/50 transition-all"
          />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {utilityTypes.map((u) => (
              <button
                key={u}
                onClick={() => onUtilityChange?.(u === "all" ? null : u)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold capitalize tracking-wide shrink-0 border transition-all ${
                  utilityFilter === u || (u === "all" && !utilityFilter)
                    ? "bg-sky-500/15 text-sky-300 border-sky-400/40"
                    : "bg-ink-900/50 text-haze border-white/5 hover:text-white hover:border-white/15"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Asset List */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
          {filteredManholes.length === 0 ? (
            <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 text-center p-4">
              <MapIcon className="h-6 w-6 text-haze/50" />
              <p className="text-xs font-bold text-white">No assets found</p>
              <p className="text-[10px] text-haze">Try adjusting filters or search terms</p>
            </div>
          ) : (
            filteredManholes.map((m) => {
              const isSelected = m.id === selectedManholeId;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectManhole?.(m.id)}
                  className={`group flex flex-col gap-2 rounded-2xl border p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? "border-sky-400/60 bg-sky-500/10 shadow-lg shadow-sky-500/8"
                      : "border-white/5 bg-ink-900/40 hover:border-white/15 hover:bg-ink-900/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                      {m.code || `MH-${m.id.substring(0, 6)}`}
                    </span>
                    <StatusPip status={m.status} showLabel />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-haze pt-1.5 border-t border-white/5">
                    <span className="capitalize font-medium flex items-center gap-1">
                      <UtilityIcon type={m.utilityType} className="h-3 w-3 text-sky-400" />
                      {m.utilityType || "unassigned"}
                    </span>
                    <span className="font-mono flex items-center gap-1">
                      <RulerIcon className="h-3 w-3 text-haze/70" />
                      {m.depthMeters ? `${m.depthMeters}m` : "N/A"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Fixed Bottom Navigation & Sign Out */}
      <div className="shrink-0 pt-3 mt-3 border-t border-white/8 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => router.push("/technicians")}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-ink-900/60 px-3 py-2 text-xs font-semibold text-white hover:border-sky-400/30 hover:bg-ink-800/70 transition-all"
          >
            <UsersIcon className="h-3.5 w-3.5 text-sky-400" /> Technicians
          </button>
          <button
            onClick={() => router.push("/inspections")}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-ink-900/60 px-3 py-2 text-xs font-semibold text-white hover:border-sky-400/30 hover:bg-ink-800/70 transition-all"
          >
            <ClipboardIcon className="h-3.5 w-3.5 text-sky-400" /> Inspections
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/15 transition-all active:scale-[0.98]"
        >
          <SignOutIcon className="h-3.5 w-3.5 text-rose-400" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
