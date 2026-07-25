"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { listManholes, Manhole } from "@/lib/api";
import { ManholeTable } from "@/components/ManholeTable";

const ManholeMap = dynamic(
  () => import("@/components/ManholeMap").then((m) => m.ManholeMap),
  { ssr: false, loading: () => <div className="h-[480px] rounded-lg border border-ink-700" /> }
);

export default function ManholesPage() {
  const [manholes, setManholes] = useState<Manhole[]>([]);
  const [view, setView] = useState<"table" | "map">("map");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listManholes()
      .then(setManholes)
      .catch(() => setError("Couldn't load manholes from the backend."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-700 text-mist">Manholes</h1>
          <p className="font-mono text-xs uppercase tracking-wide text-haze">
            {manholes.length} registered
          </p>
        </div>
        <div className="flex gap-2 rounded-lg border border-ink-700 p-1">
          <button
            onClick={() => setView("map")}
            className={`rounded px-3 py-1.5 text-sm ${
              view === "map" ? "bg-ink-800 text-mist" : "text-haze"
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setView("table")}
            className={`rounded px-3 py-1.5 text-sm ${
              view === "table" ? "bg-ink-800 text-mist" : "text-haze"
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="h-[480px] animate-pulse rounded-lg border border-ink-700 bg-ink-900/40" />
      ) : view === "map" ? (
        <ManholeMap manholes={manholes} />
      ) : (
        <ManholeTable manholes={manholes} />
      )}
    </div>
  );
}
