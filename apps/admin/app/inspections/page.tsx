"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listAllInspections,
  listTechnicians,
  Inspection,
  Technician,
} from "@/lib/api";

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

    const matchesTech =
      selectedTechFilter === "all" || log.technicianId === selectedTechFilter;

    const matchesUtility =
      selectedUtilityFilter === "all" || log.manhole?.utilityType === selectedUtilityFilter;

    return matchesSearch && matchesTech && matchesUtility;
  });

  const utilityTypes = ["all", "sewer", "water", "telecom", "electrical"];

  return (
    <div className="min-h-screen bg-ink-950 text-mist p-6 md:p-10 font-sans">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/manholes"
              className="flex items-center gap-1.5 text-xs text-haze hover:text-mist transition-colors bg-ink-900 border border-white/10 px-3 py-1.5 rounded-xl"
            >
              <span>← Back to Map</span>
            </Link>
            <span className="text-xs font-mono uppercase tracking-widest text-caution">
              Field Audit Trail
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            📋 Global Inspection Feed
          </h1>
          <p className="text-xs text-haze">
            Real-time chronological timeline of all field inspections logged across utility assets
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search notes, manhole code or tech..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 md:w-80 rounded-2xl border border-white/10 bg-ink-900/80 px-4 py-2.5 text-xs text-mist placeholder-haze outline-none focus:border-survey/60 transition-all shadow-inner"
          />
          <button
            onClick={fetchFeed}
            title="Refresh feed"
            className="rounded-2xl border border-white/10 bg-ink-900/80 p-2.5 text-haze hover:border-survey/40 hover:text-survey transition-colors shadow-md"
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
      </div>

      {/* Filter Toolbar */}
      <div className="max-w-7xl mx-auto glass-panel p-4 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-haze font-semibold mr-1">Filter Utility:</span>
          {utilityTypes.map((u) => (
            <button
              key={u}
              onClick={() => setSelectedUtilityFilter(u)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                selectedUtilityFilter === u
                  ? "bg-caution/20 text-caution border border-caution/40 shadow-md"
                  : "bg-ink-900/80 text-haze border border-white/5 hover:text-mist"
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-haze font-semibold">Filter Technician:</span>
          <select
            value={selectedTechFilter}
            onChange={(e) => setSelectedTechFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-900 px-3 py-1.5 text-xs text-mist outline-none focus:border-survey"
          >
            <option value="all">All Technicians ({technicians.length})</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-white hover:opacity-80">✕</button>
        </div>
      )}

      {/* Feed List */}
      <div className="max-w-7xl mx-auto space-y-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-3xl bg-ink-900/40 border border-white/5 animate-pulse"
            />
          ))
        ) : filteredLogs.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-3xl border border-white/10 text-haze">
            <p className="text-lg font-bold mb-1">No Inspection Logs Found</p>
            <p className="text-xs">No inspections match your search filters.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="glass-panel group p-5 md:p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl"
            >
              {/* Left Column: Tech & Manhole Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 font-bold font-display text-base border border-emerald-500/20 shrink-0">
                  {log.technician ? log.technician.name.substring(0, 2).toUpperCase() : "MH"}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-mist text-base">
                      {log.technician?.name || "Unknown Technician"}
                    </span>
                    <span className="text-[11px] font-mono text-haze">
                      ({log.technician?.email || "No email"})
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-survey/20 text-survey border border-survey/30">
                      {log.manhole?.code || `MH-${log.manholeId.substring(0, 6)}`}
                    </span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-ink-900 text-haze border border-white/5">
                      🔧 {log.manhole?.utilityType || "utility"}
                    </span>
                  </div>

                  <p className="text-xs text-mist bg-ink-950/60 p-3 rounded-2xl border border-white/5 mt-2">
                    {log.notes || "No additional observation notes recorded."}
                  </p>

                  <span className="text-[11px] text-haze block font-mono pt-1">
                    🕒 Inspected: {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Right Column: Photo Preview */}
              {log.photoUrl && (
                <div className="shrink-0 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedPhoto(log.photoUrl)}
                    className="group relative h-20 w-24 rounded-2xl overflow-hidden border border-white/10 bg-black shadow-lg"
                  >
                    <img
                      src={log.photoUrl}
                      alt="Inspection photo"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity">
                      View Photo
                    </div>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-xl w-full rounded-3xl overflow-hidden border border-white/20 bg-ink-950 p-2 shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              ✕
            </button>
            <img
              src={selectedPhoto}
              alt="Inspection enlarged view"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
