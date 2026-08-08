"use client";

interface FloatingMetricsProps {
  total: number;
  active: number;
  damaged: number;
  buriedOrInactive: number;
  selectedFilter?: string | null;
  onFilterSelect?: (status: string | null) => void;
}

export function FloatingMetrics({
  total,
  active,
  damaged,
  buriedOrInactive,
  selectedFilter,
  onFilterSelect,
}: FloatingMetricsProps) {
  const metrics = [
    {
      id: "all",
      label: "TOTAL ASSETS",
      value: total,
      color: "text-white",
      dot: "bg-sky-400",
      bg: "border-white/10",
      activeBg: "border-sky-400 bg-sky-500/15 shadow-sky-500/15",
    },
    {
      id: "active",
      label: "ACTIVE",
      value: active,
      color: "text-emerald-400",
      dot: "bg-emerald-400",
      bg: "border-emerald-500/20 bg-emerald-500/5",
      activeBg: "border-emerald-400 bg-emerald-500/20 shadow-emerald-500/15",
    },
    {
      id: "damaged",
      label: "DAMAGED",
      value: damaged,
      color: "text-rose-400",
      dot: "bg-rose-400",
      bg: "border-rose-500/20 bg-rose-500/5",
      activeBg: "border-rose-400 bg-rose-500/20 shadow-rose-500/15",
    },
    {
      id: "other",
      label: "INACTIVE",
      value: buriedOrInactive,
      color: "text-amber-400",
      dot: "bg-amber-400",
      bg: "border-amber-500/20 bg-amber-500/5",
      activeBg: "border-amber-400 bg-amber-500/20 shadow-amber-500/15",
    },
  ];

  return (
    <div className="absolute bottom-6 left-4 z-20 flex flex-col gap-2">
      {metrics.map((m) => {
        const isActive = selectedFilter === m.id || (m.id === "all" && !selectedFilter);
        return (
          <button
            key={m.id}
            onClick={() => onFilterSelect?.(m.id === "all" ? null : m.id)}
            className={`glass-panel flex items-center justify-between gap-5 rounded-2xl px-4 py-2.5 min-w-[140px] border transition-all duration-200 hover:scale-[1.04] active:scale-95 shadow-xl ${
              isActive ? m.activeBg : `${m.bg} hover:border-white/20`
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-haze uppercase">
                {m.label}
              </span>
              <span className={`font-display text-xl font-black tracking-tight ${m.color}`}>
                {m.value}
              </span>
            </div>
            <div className={`h-2.5 w-2.5 rounded-full ${m.dot} ${isActive ? "animate-glow-pulse" : "opacity-50"}`} />
          </button>
        );
      })}
    </div>
  );
}
