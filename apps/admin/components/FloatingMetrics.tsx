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
      label: "TOTAL",
      value: total,
      color: "text-mist",
      bg: "bg-ink-800/80 border-ink-700",
      activeBg: "bg-survey/20 border-survey text-survey",
    },
    {
      id: "active",
      label: "ACTIVE",
      value: active,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      activeBg: "bg-emerald-500/30 border-emerald-400 text-emerald-300",
    },
    {
      id: "damaged",
      label: "DAMAGED",
      value: damaged,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      activeBg: "bg-rose-500/30 border-rose-400 text-rose-300",
    },
    {
      id: "other",
      label: "INACTIVE",
      value: buriedOrInactive,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      activeBg: "bg-amber-500/30 border-amber-400 text-amber-300",
    },
  ];

  return (
    <div className="absolute bottom-6 left-4 z-20 flex flex-col gap-2.5">
      {metrics.map((m) => {
        const isSelected = selectedFilter === m.id || (m.id === "all" && !selectedFilter);
        return (
          <button
            key={m.id}
            onClick={() => onFilterSelect?.(m.id === "all" ? null : m.id)}
            className={`glass-panel flex items-center justify-between gap-4 rounded-2xl px-3.5 py-2.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg min-w-[130px] ${
              isSelected ? m.activeBg : `${m.bg} hover:border-white/20`
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="font-mono text-[10px] font-bold tracking-wider text-haze uppercase">
                {m.label}
              </span>
              <span className={`font-display text-lg font-extrabold ${m.color}`}>
                {m.value}
              </span>
            </div>
            <div className="h-2 w-2 rounded-full bg-current opacity-80" />
          </button>
        );
      })}
    </div>
  );
}
