import { ManholeStatus } from "@/lib/api";

const STATUS_META: Record<ManholeStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "#38BDF8" },
  inactive: { label: "Inactive", color: "#A78BFA" },
  buried: { label: "Buried", color: "#F5A623" },
  damaged: { label: "Damaged", color: "#F87171" },
};

/**
 * Renders a small manhole-cover glyph (bolt ring around a hub) tinted by
 * status. Used in the table, the map markers, and the form — the one
 * recurring motif tying the whole dashboard back to its subject.
 */
export function StatusPip({
  status,
  showLabel = true,
  size = 16,
}: {
  status: ManholeStatus;
  showLabel?: boolean;
  size?: number;
}) {
  const meta = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke={meta.color} strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4.5" fill="none" stroke={meta.color} strokeWidth="1.5" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = 12 + Math.cos(angle) * 8.2;
          const y = 12 + Math.sin(angle) * 8.2;
          return <circle key={i} cx={x} cy={y} r="0.9" fill={meta.color} />;
        })}
      </svg>
      {showLabel && (
        <span className="font-mono text-xs uppercase tracking-wide text-haze">
          {meta.label}
        </span>
      )}
    </span>
  );
}

export function statusColor(status: ManholeStatus) {
  return STATUS_META[status].color;
}
