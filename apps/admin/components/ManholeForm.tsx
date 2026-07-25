"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Manhole, ManholeInput, ManholeStatus, UtilityType } from "@/lib/api";

const STATUS_OPTIONS: ManholeStatus[] = [
  "active",
  "inactive",
  "buried",
  "damaged",
];

const UTILITY_OPTIONS: UtilityType[] = [
  "sewer",
  "electrical",
  "telecom",
  "water",
];

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
  const router = useRouter();
  const [code, setCode] = useState(initial?.code ?? "");
  const [status, setStatus] = useState<ManholeStatus>(initial?.status ?? "active");
  const [latStr, setLatStr] = useState(initial?.lat?.toString() ?? "");
  const [lngStr, setLngStr] = useState(initial?.lng?.toString() ?? "");
  const [utilityType, setUtilityType] = useState<UtilityType>(initial?.utilityType ?? "sewer");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!code.trim()) return setError("Code is required.");
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return setError("Latitude and longitude must be valid numbers.");
    }

    setSubmitting(true);
    try {
      await onSubmit({
        code: code.trim(),
        status,
        lat,
        lng,
        utilityType,
      });
      router.push("/manholes");
    } catch (err) {
      setError("Couldn't save this manhole. Check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      {error && (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-haze">Code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="MH-0231"
          className="rounded border border-ink-700 bg-ink-900 px-3 py-2 font-mono text-mist outline-none focus:border-survey"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-haze">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ManholeStatus)}
          className="rounded border border-ink-700 bg-ink-900 px-3 py-2 text-mist outline-none focus:border-survey"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-haze">Latitude</span>
          <input
            value={latStr}
            onChange={(e) => setLatStr(e.target.value)}
            placeholder="12.97160"
            className="rounded border border-ink-700 bg-ink-900 px-3 py-2 font-mono text-mist outline-none focus:border-survey"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-haze">Longitude</span>
          <input
            value={lngStr}
            onChange={(e) => setLngStr(e.target.value)}
            placeholder="77.59460"
            className="rounded border border-ink-700 bg-ink-900 px-3 py-2 font-mono text-mist outline-none focus:border-survey"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-haze">Utility Type</span>
        <select
          value={utilityType}
          onChange={(e) => setUtilityType(e.target.value as UtilityType)}
          className="rounded border border-ink-700 bg-ink-900 px-3 py-2 text-mist outline-none focus:border-survey"
        >
          {UTILITY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-caution px-4 py-2 text-sm font-semibold text-ink-950 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
