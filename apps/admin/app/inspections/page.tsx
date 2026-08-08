"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listAllInspections,
  listTechnicians,
  Inspection,
  Technician,
} from "@/lib/api";
import {
  ClipboardIcon,
  RefreshIcon,
  AlertIcon,
  UtilityIcon,
  ClockIcon,
} from "@/components/Icons";

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>("all");
  const [selectedUtilityFilter, setSelectedUtilityFilter] = useState<string>("all");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function fetchFeed() {
    setLoading(true);
    Promise.all([listAllInspections(), listTechnicians()])
      .then(([logsData, techsData]) => {
        setInspections(logsData);
        setTechnicians(techsData);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch global inspection logs.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchFeed();
  }, []);

  const filteredLogs = inspections.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.manhole?.code && log.manhole.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.technician?.name && log.technician.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.technician?.email && log.technician.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTech = selectedTechFilter === "all" || log.technicianId === selectedTechFilter;
    const matchesUtility = selectedUtilityFilter === "all" || log.manhole?.utilityType === selectedUtilityFilter;
    return matchesSearch && matchesTech && matchesUtility;
  });

  const utilityTypes = ["all", "telecom", "sewer", "water", "electrical"];

  return (
    <div className="relative min-h-screen bg-ink-950 bg-grid-cyber text-mist p-6 md:p-10">
      {/* Ambient */}
      <div className="pointer-events-none fixed -top-32 right-10 h-[380px] w-[380px] rounded-full bg-sky-500/6 blur-[120px] animate-ambient" />
      <div className="pointer-events-none fixed bottom-10 -left-20 h-[350px] w-[350px] rounded-full bg-cyan-500/5 blur-[140px] animate-ambient" />

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/manholes" className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-white transition-all bg-ink-900/80 border border-white/10 px-3.5 py-1.5 rounded-xl shadow-md hover:border-sky-400/30">
              ← Command Map
            </Link>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
              AUDIT FEED
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ClipboardIcon className="h-7 w-7 text-sky-400" /> Inspection Timeline
          </h1>
          <p className="text-xs text-haze mt-0.5">Chronological timeline of all field inspections across utility assets</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search notes, code or tech…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 md:w-80 rounded-2xl border border-white/10 bg-ink-900/80 px-4 py-2.5 text-xs text-white placeholder-haze/50 outline-none focus:border-sky-400/50 transition-all shadow-inner"
          />
          <button onClick={fetchFeed} title="Refresh" className="rounded-2xl border border-white/10 bg-ink-900/80 p-2.5 text-haze hover:border-sky-400/30 hover:text-sky-400 transition-all shadow-md active:scale-95">
            <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin text-sky-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative z-10 max-w-7xl mx-auto glass-panel p-4 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 mb-8 shadow-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[9px] font-bold text-haze uppercase tracking-[0.12em] mr-1">UTILITY:</span>
          {utilityTypes.map((u) => (
            <button
              key={u}
              onClick={() => setSelectedUtilityFilter(u)}
              className={`rounded-xl px-3 py-1.5 text-[10px] font-bold capitalize border transition-all ${
                selectedUtilityFilter === u
                  ? "bg-sky-500/15 text-sky-300 border-sky-400/40"
                  : "bg-ink-900/60 text-haze border-white/5 hover:text-white hover:border-white/15"
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] font-bold text-haze uppercase tracking-[0.12em]">TECH:</span>
          <select
            value={selectedTechFilter}
            onChange={(e) => setSelectedTechFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-900/80 px-3.5 py-1.5 text-xs text-white outline-none focus:border-sky-400/50"
          >
            <option value="all">All ({technicians.length})</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="relative z-10 max-w-7xl mx-auto mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex justify-between items-center shadow-xl">
          <span className="flex items-center gap-2">
            <AlertIcon className="h-4 w-4 text-red-400 shrink-0" /> {error}
          </span>
          <button onClick={() => setError(null)} className="text-white/70 hover:text-white">✕</button>
        </div>
      )}

      {/* Feed */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-4">
        {loading ? (
          [1,2,3,4].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-ink-900/30 border border-white/5 animate-pulse" />
          ))
        ) : filteredLogs.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-3xl border border-white/10 text-haze">
            <p className="text-lg font-bold text-white mb-1">No Logs Found</p>
            <p className="text-xs">Try adjusting your search filters.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="glass-card p-5 md:p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500/15 to-cyan-500/15 text-sky-400 font-bold font-display text-base border border-sky-500/20 shrink-0 shadow-md shadow-sky-500/8">
                  {log.technician ? log.technician.name.substring(0, 2).toUpperCase() : "MH"}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-white text-base">{log.technician?.name || "Unknown"}</span>
                    <span className="text-[10px] font-mono text-haze">({log.technician?.email || "—"})</span>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25">
                      {log.manhole?.code || `MH-${log.manholeId.substring(0, 6)}`}
                    </span>
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-ink-900/80 text-haze border border-white/5 flex items-center gap-1">
                      <UtilityIcon type={log.manhole?.utilityType} className="h-3 w-3 text-sky-400" />
                      {log.manhole?.utilityType || "utility"}
                    </span>
                  </div>

                  <p className="text-xs text-mist/80 bg-ink-950/50 p-3 rounded-xl border border-white/5 mt-1">
                    {log.notes || "No observation notes."}
                  </p>

                  <span className="text-[10px] text-haze block font-mono pt-0.5 flex items-center gap-1">
                    <ClockIcon className="h-3 w-3 text-haze/70 inline" />
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {log.photoUrl && (
                <div className="shrink-0">
                  <button
                    onClick={() => setSelectedPhoto(log.photoUrl)}
                    className="group relative h-20 w-24 rounded-2xl overflow-hidden border border-white/10 bg-black shadow-lg"
                  >
                    <img src={log.photoUrl} alt="Inspection" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white transition-opacity">
                      View
                    </div>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-xl w-full rounded-3xl overflow-hidden border border-white/15 bg-ink-950 p-2 shadow-2xl">
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black">✕</button>
            <img src={selectedPhoto} alt="Enlarged" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
