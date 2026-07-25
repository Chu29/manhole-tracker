"use client";

import Link from "next/link";
import { Manhole } from "@/lib/api";
import { StatusPip } from "./StatusPip";

export function ManholeTable({ manholes }: { manholes: Manhole[] }) {
  if (manholes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-700 p-10 text-center text-haze">
        No manholes registered yet. Add the first one to see it on the map.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-ink-900 font-mono text-[11px] uppercase tracking-wide text-haze">
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Coordinates</th>
            <th className="px-4 py-3">Last inspected</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-700">
          {manholes.map((m) => (
            <tr key={m.id} className="bg-ink-900/40 hover:bg-ink-800/60">
              <td className="px-4 py-3 font-mono text-mist">{m.code}</td>
              <td className="px-4 py-3">
                <StatusPip status={m.status} />
              </td>
              <td className="px-4 py-3 font-mono text-xs text-haze">
                {m.lat.toFixed(5)}, {m.lng.toFixed(5)}
              </td>
              <td className="px-4 py-3 text-haze">
                {m.lastInspectedAt
                  ? new Date(m.lastInspectedAt).toLocaleDateString()
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={`/manholes/${m.id}`} className="text-survey hover:underline">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
