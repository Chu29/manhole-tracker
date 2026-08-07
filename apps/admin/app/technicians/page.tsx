"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listTechnicians,
  getTechnician,
  updateTechnician,
  Technician,
  TechnicianDetail,
} from "@/lib/api";

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [techDetail, setTechDetail] = useState<TechnicianDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingRole, setEditingRole] = useState<string>("");
  const [editingOrg, setEditingOrg] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  function fetchTechs() {
    setLoading(true);
    listTechnicians()
      .then(setTechnicians)
      .catch((err) => {
        console.error(err);
        setError("Failed to load technicians.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchTechs();
  }, []);

  function handleSelectTech(id: string) {
    setSelectedTechId(id);
    setLoadingDetail(true);
    getTechnician(id)
      .then((detail) => {
        setTechDetail(detail);
        setEditingRole(detail.role || "technician");
        setEditingOrg(detail.orgId || "");
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load technician details.");
      })
      .finally(() => setLoadingDetail(false));
  }

  async function handleSaveSettings() {
    if (!selectedTechId) return;
    setSaving(true);
    try {
      const updated = await updateTechnician(selectedTechId, {
        role: editingRole,
        orgId: editingOrg || null,
      });
      setTechDetail((prev) => (prev ? { ...prev, ...updated } : null));
      fetchTechs();
    } catch (err) {
      console.error(err);
      setError("Failed to update technician settings.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = technicians.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.role && t.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.orgId && t.orgId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalInspections = technicians.reduce(
    (acc, t) => acc + (t.inspectionCount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-ink-950 text-mist p-6 md:p-10 font-sans">
      {/* Top Header Bar */}
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
              Admin Management
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            👷 Field Technicians Directory
          </h1>
          <p className="text-xs text-haze">
            Manage registered technicians, update roles, and review individual field logs
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search technician name, email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 md:w-80 rounded-2xl border border-white/10 bg-ink-900/80 px-4 py-2.5 text-xs text-mist placeholder-haze outline-none focus:border-survey/60 transition-all shadow-inner"
          />
          <button
            onClick={fetchTechs}
            title="Refresh technicians"
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

      {/* Overview Stat Badges */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-survey/10 border border-survey/30 flex items-center justify-center text-survey text-xl">
            👥
          </div>
          <div>
            <p className="text-xs font-medium text-haze uppercase tracking-wider">
              Total Technicians
            </p>
            <p className="font-display text-2xl font-bold text-mist">
              {technicians.length}
            </p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl">
            📋
          </div>
          <div>
            <p className="text-xs font-medium text-haze uppercase tracking-wider">
              Total Inspections Logs
            </p>
            <p className="font-display text-2xl font-bold text-mist">
              {totalInspections}
            </p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-caution/10 border border-caution/30 flex items-center justify-center text-caution text-xl">
            ⚡
          </div>
          <div>
            <p className="text-xs font-medium text-haze uppercase tracking-wider">
              System Status
            </p>
            <p className="font-display text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Active Monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-white hover:opacity-80">✕</button>
        </div>
      )}

      {/* Technician Cards Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-44 rounded-3xl bg-ink-900/40 border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-3xl border border-white/10 text-haze">
            <p className="text-lg font-bold mb-1">No Technicians Found</p>
            <p className="text-xs">Try adjusting your search criteria or register a technician via the mobile app.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tech) => (
              <div
                key={tech.id}
                className="glass-panel group relative flex flex-col justify-between p-6 rounded-3xl border border-white/10 hover:border-survey/40 hover:bg-ink-900/60 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-survey/20 to-caution/20 text-survey font-bold font-display text-lg border border-white/10">
                        {tech.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-mist text-base group-hover:text-survey transition-colors">
                          {tech.name}
                        </h3>
                        <p className="text-xs font-mono text-haze">{tech.email}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border ${
                        tech.role === "admin"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {tech.role || "technician"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-ink-950/60 border border-white/5 text-xs text-haze mb-4">
                    <div>
                      <span className="block text-[10px] uppercase font-mono text-haze/70">
                        Inspections Logged
                      </span>
                      <span className="font-bold text-mist text-sm">
                        {tech.inspectionCount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-mono text-haze/70">
                        Organization
                      </span>
                      <span className="font-mono text-mist truncate block">
                        {tech.orgId || "Default Org"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-[11px] text-haze">
                    Joined: {tech.createdAt ? new Date(tech.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                  <button
                    onClick={() => handleSelectTech(tech.id)}
                    className="flex items-center gap-1 font-semibold text-survey hover:underline text-xs"
                  >
                    View Logs →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Technician Activity Detail Modal */}
      {selectedTechId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 relative max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-survey/20 text-survey font-bold font-display text-xl border border-survey/30">
                  {techDetail ? techDetail.name.substring(0, 2).toUpperCase() : "..."}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    {techDetail ? techDetail.name : "Loading Technician..."}
                  </h2>
                  <p className="text-xs font-mono text-haze">
                    {techDetail ? techDetail.email : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTechId(null);
                  setTechDetail(null);
                }}
                className="rounded-xl border border-white/10 p-2 text-haze hover:bg-ink-800 hover:text-mist transition-colors"
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div className="h-64 flex items-center justify-center text-haze text-xs animate-pulse">
                Loading technician activity logs...
              </div>
            ) : techDetail ? (
              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                {/* Admin Management Box */}
                <div className="p-4 rounded-2xl bg-ink-900/80 border border-white/10 flex flex-col sm:flex-row items-end gap-4 justify-between">
                  <div className="w-full sm:w-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-haze uppercase mb-1">
                        System Role
                      </label>
                      <select
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-xs text-mist outline-none focus:border-survey"
                      >
                        <option value="technician">Technician</option>
                        <option value="admin">Administrator</option>
                        <option value="supervisor">Supervisor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-haze uppercase mb-1">
                        Organization ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Org-01"
                        value={editingOrg}
                        onChange={(e) => setEditingOrg(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-xs text-mist outline-none focus:border-survey"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="w-full sm:w-auto rounded-xl bg-survey px-4 py-2 text-xs font-bold text-ink-950 hover:bg-amber-400 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                </div>

                {/* Inspection Logs List */}
                <div>
                  <h3 className="font-display font-bold text-mist text-sm mb-3 flex items-center justify-between">
                    <span>📋 Field Inspection Logs ({techDetail.inspectionLogs?.length || 0})</span>
                  </h3>

                  {!techDetail.inspectionLogs || techDetail.inspectionLogs.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 text-xs text-haze">
                      No inspection logs recorded by this technician yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {techDetail.inspectionLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-4 rounded-2xl bg-ink-950/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-survey">
                                {log.manhole?.code || `MH-${log.manholeId.substring(0, 6)}`}
                              </span>
                              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-ink-800 text-haze border border-white/5">
                                🔧 {log.manhole?.utilityType || "utility"}
                              </span>
                            </div>
                            <p className="text-xs text-mist">
                              {log.notes || "No observation notes written."}
                            </p>
                            <span className="text-[11px] text-haze block font-mono">
                              🕒 {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {log.photoUrl && (
                            <button
                              onClick={() => setSelectedPhoto(log.photoUrl)}
                              className="shrink-0 group relative h-16 w-16 rounded-xl overflow-hidden border border-white/10 bg-black"
                            >
                              <img
                                src={log.photoUrl}
                                alt="Inspection photo"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

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
