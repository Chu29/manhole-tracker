"use client";

import { useState } from "react";
import { Manhole, ManholeInput, ManholeStatus, UtilityType } from "@/lib/api";
import { AlertIcon, ClipboardIcon } from "./Icons";
import { UTILITY_TYPES } from "@manhole-tracker/shared";

const STATUS_OPTIONS: ManholeStatus[] = ["active", "inactive", "buried", "damaged"];
const UTILITY_OPTIONS: UtilityType[] = (UTILITY_TYPES as UtilityType[]) || ["telecom"];

export function ManholeForm({
  initial,
  onSubmit,
  onDelete,
  submitLabel,
}: {
  initial?: Partial<Manhole>;
  onSubmit: (input: ManholeInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitLabel: string;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [status, setStatus] = useState<ManholeStatus>(initial?.status ?? "active");
  const [latStr, setLatStr] = useState(initial?.lat?.toString() ?? "");
  const [lngStr, setLngStr] = useState(initial?.lng?.toString() ?? "");
  const [utilityType, setUtilityType] = useState<UtilityType>(initial?.utilityType ?? "telecom");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!code.trim()) return setError("Code is required.");
    if (Number.isNaN(lat) || Number.isNaN(lng)) return setError("Latitude and longitude must be valid numbers.");
    setSubmitting(true);
    try {
      await onSubmit({ code: code.trim(), status, lat, lng, utilityType });
    } catch (err: any) {
      console.error(err);
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Couldn't save. Check the fields and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setError(null);
    setDeleting(true);
    try {
      await onDelete();
    } catch (err: any) {
      console.error(err);
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Couldn't delete manhole.");
      }
    } finally {
      setDeleting(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-white/10 bg-ink-950/70 px-3.5 py-2.5 text-sm text-white outline-none focus:border-sky-400/50 transition-all placeholder-haze/40";
  const labelClass = "text-[10px] font-bold uppercase tracking-wider text-haze";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
          <AlertIcon className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Manhole Code</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="YDE-PC-TEL-001" className={`${inputClass} font-mono`} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as ManholeStatus)} className={inputClass}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>Latitude</span>
          <input value={latStr} onChange={(e) => setLatStr(e.target.value)} placeholder="3.86450" className={`${inputClass} font-mono`} />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>Longitude</span>
          <input value={lngStr} onChange={(e) => setLngStr(e.target.value)} placeholder="11.51800" className={`${inputClass} font-mono`} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Utility Type</span>
        <select value={utilityType} onChange={(e) => setUtilityType(e.target.value as UtilityType)} className={inputClass}>
          {UTILITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || deleting}
          className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting || deleting}
            className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/15 transition-all disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>

      {initial?.id && <InspectionHistorySection manholeId={initial.id} />}
    </form>
  );
}

function InspectionHistorySection({ manholeId }: { manholeId: string }) {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    import("@/lib/api").then(({ listManholeInspections }) => {
      listManholeInspections(manholeId)
        .then(setInspections)
        .catch(console.error)
        .finally(() => setLoading(false));
    });
  });

  return (
    <div className="mt-4 pt-4 border-t border-white/8 space-y-2">
      <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ClipboardIcon className="h-4 w-4 text-sky-400" /> Inspection History
        </span>
        <span className="text-[10px] text-haze font-mono">({inspections.length})</span>
      </h4>

      {loading ? (
        <div className="h-16 rounded-xl bg-ink-900/50 animate-pulse" />
      ) : inspections.length === 0 ? (
        <p className="text-xs text-haze/70 italic">No inspection logs recorded yet.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {inspections.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-ink-950/60 border border-white/5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sky-400">{log.technician?.name || "Technician"}</span>
                <span className="text-[10px] text-haze font-mono">{new Date(log.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-mist/80 text-[11px]">{log.notes || "No notes recorded"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
