export const Colors = {
  primary: "#0284C7",
  primaryDark: "#0369A1",
  primaryLight: "#F0F9FF",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  textMuted: "#64748B",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
  success: "#10B981",
  successLight: "#ECFDF5",
  offline: "#475569",
  cardShadow: "#0F172A",
} as const;

export const UtilityColors: Record<string, string> = {
  telecom: "#0284C7",
  sewer: "#7E22CE",
  electrical: "#B45309",
  water: "#0F766E",
};

export const UtilityStyles: Record<string, { bg: string; text: string; icon: string }> = {
  telecom: { bg: "#E0F2FE", text: "#0369A1", icon: "hardware-chip-outline" },
  sewer: { bg: "#F3E8FF", text: "#7E22CE", icon: "water-outline" },
  electrical: { bg: "#FEF3C7", text: "#B45309", icon: "flash-outline" },
  water: { bg: "#CCFBF1", text: "#0F766E", icon: "map-outline" },
};


