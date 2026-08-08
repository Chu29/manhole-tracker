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
import {
  UsersIcon,
  ClipboardIcon,
  ShieldIcon,
  RefreshIcon,
  AlertIcon,
  UtilityIcon,
  ClockIcon,
} from "@/components/Icons";

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
        setEditingOrg(detail.orgId || "CAMTEL");
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
    setError(null);
    try {
      const cleanOrg = editingOrg.trim();
      const updated = await updateTechnician(selectedTechId, {
        role: editingRole,
        orgId: cleanOrg.length > 0 ? cleanOrg : "CAMTEL",
      });
      setTechDetail((prev) => (prev ? { ...prev, ...updated } : null));
      fetchTechs();
    } catch (err: any) {
      console.error(err);
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Failed to update technician settings.");
      }
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

  const inputClass = "w-full rounded-xl border border-white/10 bg-ink-950/70 px-3.5 py-2 text-xs text-white outline-none focus:border-sky-400/50 transition-all";

  return (
    <div className="relative min-h-screen bg-ink-950 bg-grid-cyber text-mist p-6 md:p-10">
      {/* Ambient */}
      <div className="pointer-events-none fixed -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-sky-500/6 blur-[120px] animate-ambient" />
      <div className="pointer-events-none fixed bottom-0 left-20 h-[350px] w-[350px] rounded-full bg-cyan-500/5 blur-[140px] animate-ambient" />

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/manholes" className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-white transition-all bg-ink-900/80 border border-white/10 px-3.5 py-1.5 rounded-xl shadow-md hover:border-sky-400/30">
              ← Command Map
            </Link>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
              WORKFORCE
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UsersIcon className="h-7 w-7 text-sky-400" /> Field Technicians
          </h1>
          <p className="text-xs text-haze mt-0.5">Manage registered agents, roles, and review individual field logs</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search name, email or role…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 md:w-80 rounded-2xl border border-white/10 bg-ink-900/80 px-4 py-2.5 text-xs text-white placeholder-haze/50 outline-none focus:border-sky-400/50 transition-all shadow-inner"
          />
          <button onClick={fetchTechs} title="Refresh" className="rounded-2xl border border-white/10 bg-ink-900/80 p-2.5 text-haze hover:border-sky-400/30 hover:text-sky-400 transition-all shadow-md active:scale-95">
            <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin text-sky-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex items-center gap-4 hover:border-sky-400/30 transition-all shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shadow-md">
            <UsersIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-haze uppercase tracking-[0.12em] font-mono">REGISTERED</p>
            <p className="font-display text-2xl font-black text-white">{technicians.length}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex items-center gap-4 hover:border-emerald-400/30 transition-all shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-md">
            <ClipboardIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-haze uppercase tracking-[0.12em] font-mono">TOTAL INSPECTIONS</p>
            <p className="font-display text-2xl font-black text-white">{totalInspections}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex items-center gap-4 hover:border-cyan-400/30 transition-all shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-md">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-haze uppercase tracking-[0.12em] font-mono">SYSTEM MONITORING</p>
            <p className="font-display text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-glow-pulse" /> Active
            </p>
          </div>
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

      {/* Grid */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-44 rounded-3xl bg-ink-900/30 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-3xl border border-white/10 text-haze">
            <p className="text-lg font-bold text-white mb-1">No Technicians Found</p>
            <p className="text-xs">Try adjusting search or register via the mobile app.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tech) => (
              <div
                key={tech.id}
                className="glass-card group relative flex flex-col justify-between p-6 rounded-3xl"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500/15 to-cyan-500/15 text-sky-400 font-bold font-display text-lg border border-sky-500/20 shadow-md shadow-sky-500/8">
                        {tech.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-white text-base group-hover:text-sky-300 transition-colors">{tech.name}</h3>
                        <p className="text-xs font-mono text-haze">{tech.email}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border ${
                      tech.role === "admin" ? "bg-purple-500/15 text-purple-300 border-purple-500/25" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                    }`}>
                      {tech.role || "technician"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-ink-950/50 border border-white/5 text-xs text-haze mb-4">
                    <div>
                      <span className="block text-[9px] uppercase font-mono text-haze/60 tracking-wider">Inspections</span>
                      <span className="font-bold text-white text-sm font-display">{tech.inspectionCount || 0}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-mono text-haze/60 tracking-wider">Organization</span>
                      <span className="font-mono text-white truncate block text-xs">{tech.orgId || "Default"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                  <span className="text-[10px] font-mono text-haze">
                    {tech.createdAt ? new Date(tech.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                  <button onClick={() => handleSelectTech(tech.id)} className="font-bold text-sky-400 hover:text-white transition-colors flex items-center gap-1">
                    View Logs <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTechId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500/20 to-cyan-500/20 text-sky-400 font-bold font-display text-xl border border-sky-500/25">
                  {techDetail ? techDetail.name.substring(0, 2).toUpperCase() : "··"}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-white">{techDetail?.name || "Loading…"}</h2>
                  <p className="text-xs font-mono text-haze">{techDetail?.email || ""}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedTechId(null); setTechDetail(null); }}
                className="rounded-xl border border-white/8 p-2 text-haze hover:bg-ink-800 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div className="h-64 flex items-center justify-center text-haze text-xs animate-pulse">Loading activity logs…</div>
            ) : techDetail ? (
              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                {/* Settings */}
                <div className="p-4 rounded-2xl bg-ink-900/60 border border-white/8 flex flex-col sm:flex-row items-end gap-4 justify-between">
                  <div className="w-full sm:w-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-haze uppercase tracking-wider mb-1.5">System Role</label>
                      <select value={editingRole} onChange={(e) => setEditingRole(e.target.value)} className={inputClass}>
                        <option value="technician">Technician</option>
                        <option value="admin">Administrator</option>
                        <option value="supervisor">Supervisor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-haze uppercase tracking-wider mb-1.5">Organization Name</label>
                      <input type="text" placeholder="e.g. CAMTEL" value={editingOrg} onChange={(e) => setEditingOrg(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-sky-500/15 hover:brightness-110 transition-all disabled:opacity-50 shrink-0"
                  >
                    {saving ? "Saving…" : "Save Settings"}
                  </button>
                </div>

                {/* Logs */}
                <div>
                  <h3 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
                    <ClipboardIcon className="h-4 w-4 text-sky-400" /> Field Logs ({techDetail.inspectionLogs?.length || 0})
                  </h3>
                  {!techDetail.inspectionLogs || techDetail.inspectionLogs.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 text-xs text-haze">
                      No inspection logs recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {techDetail.inspectionLogs.map((log) => (
                        <div key={log.id} className="p-4 rounded-2xl bg-ink-950/50 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-sky-400">{log.manhole?.code || `MH-${log.manholeId.substring(0, 6)}`}</span>
                              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-ink-800 text-haze border border-white/5 flex items-center gap-1">
                                <UtilityIcon type={log.manhole?.utilityType} className="h-3 w-3 text-sky-400" />
                                {log.manhole?.utilityType || "utility"}
                              </span>
                            </div>
                            <p className="text-xs text-mist/80">{log.notes || "No notes."}</p>
                            <span className="text-[10px] text-haze block font-mono flex items-center gap-1">
                              <ClockIcon className="h-3 w-3 text-haze/70 inline" />
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {log.photoUrl && (
                            <button onClick={() => setSelectedPhoto(log.photoUrl)} className="shrink-0 group h-16 w-16 rounded-xl overflow-hidden border border-white/10 bg-black">
                              <img src={log.photoUrl} alt="Inspection" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
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

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-xl w-full rounded-3xl overflow-hidden border border-white/15 bg-ink-950 p-2 shadow-2xl">
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black">✕</button>
            <img src={selectedPhoto} alt="Enlarged" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
