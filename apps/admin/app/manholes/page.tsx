"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { listManholes, createManhole, updateManhole, deleteManhole, Manhole } from "@/lib/api";
import { FloatingMetrics } from "@/components/FloatingMetrics";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { ManholeForm } from "@/components/ManholeForm";

const ManholeMap = dynamic(
  () => import("@/components/ManholeMap").then((m) => m.ManholeMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-ink-950 bg-blueprint bg-grid animate-pulse" /> }
);

export default function ManholesPage() {
  const [manholes, setManholes] = useState<Manhole[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [utilityFilter, setUtilityFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editManholeId, setEditManholeId] = useState<string | null>(null);

  function fetchManholes() {
    setLoading(true);
    listManholes()
      .then(setManholes)
      .catch(() => setError("Couldn't load manholes from the backend."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchManholes();
  }, []);

  // Filter manholes by search term and status filter
  const displayedManholes = manholes.filter((m) => {
    const matchesSearch =
      !searchTerm ||
      m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.utilityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.status?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (utilityFilter && utilityFilter !== "all" && m.utilityType !== utilityFilter) {
      return false;
    }

    if (statusFilter === "active") return m.status === "active";
    if (statusFilter === "damaged") return m.status === "damaged";
    if (statusFilter === "other") return m.status !== "active" && m.status !== "damaged";

    return true;
  });

  const activeCount = manholes.filter((m) => m.status === "active").length;
  const damagedCount = manholes.filter((m) => m.status === "damaged").length;
  const otherCount = manholes.filter((m) => m.status !== "active" && m.status !== "damaged").length;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ink-950">
      {/* 1. Full-Screen Interactive Map Canvas */}
      <div className="absolute inset-0 z-0">
        <ManholeMap
          manholes={displayedManholes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onEditClick={setEditManholeId}
        />
      </div>

      {/* 3. Bottom-Left Floating Metric Badges */}
      <FloatingMetrics
        total={manholes.length}
        active={activeCount}
        damaged={damagedCount}
        buriedOrInactive={otherCount}
        selectedFilter={statusFilter}
        onFilterSelect={setStatusFilter}
      />

      {/* 4. Right Floating Sidebar Control Panel */}
      <FloatingSidebar
        manholes={manholes}
        selectedManholeId={selectedId}
        onSelectManhole={setSelectedId}
        onRegisterClick={() => setShowRegisterModal(true)}
        onRefresh={fetchManholes}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        utilityFilter={utilityFilter}
        onUtilityChange={setUtilityFilter}
      />

      {/* Error Notification Toast */}
      {error && (
        <div className="glass-panel fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/20 px-4 py-2.5 text-xs text-red-200 shadow-2xl">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-white hover:opacity-80">✕</button>
        </div>
      )}

      {/* 5. Register Manhole Modal Overlay */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-white/10 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-mist">
                  Register New Manhole
                </h2>
                <p className="text-xs text-haze">
                  Add geospatial coordinates and utility metadata
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="rounded-xl border border-white/10 p-2 text-haze hover:bg-ink-800 hover:text-mist transition-colors"
              >
                ✕
              </button>
            </div>

            <ManholeForm
              submitLabel="Register Manhole"
              onSubmit={(input) =>
                createManhole(input).then(() => {
                  setShowRegisterModal(false);
                  fetchManholes();
                })
              }
            />
          </div>
        </div>
      )}

      {/* 6. Edit Manhole Modal Overlay */}
      {editManholeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-white/10 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-mist">
                  Edit Manhole
                </h2>
                <p className="text-xs text-haze">
                  Update metadata or record inspections
                </p>
              </div>
              <button
                onClick={() => setEditManholeId(null)}
                className="rounded-xl border border-white/10 p-2 text-haze hover:bg-ink-800 hover:text-mist transition-colors"
              >
                ✕
              </button>
            </div>

            <ManholeForm
              initial={manholes.find((m) => m.id === editManholeId)}
              submitLabel="Save Changes"
              onSubmit={(input) =>
                updateManhole(editManholeId, input).then(() => {
                  setEditManholeId(null);
                  fetchManholes();
                })
              }
              onDelete={async () => {
                if (!confirm("Delete this manhole? This can't be undone.")) return;
                await deleteManhole(editManholeId);
                setEditManholeId(null);
                setSelectedId(null);
                fetchManholes();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
