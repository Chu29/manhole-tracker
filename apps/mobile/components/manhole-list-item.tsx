import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Manhole } from "../api/manholes";
import { formatDistance } from "../services/geo";
import { Colors, UtilityColors, UtilityStyles } from "../constants/theme";

interface Props {
  manhole: Manhole;
  onPress: () => void;
  onViewDetails?: () => void;
}

export function ManholeListItem({ manhole, onPress, onViewDetails }: Props) {
  const typeKey = manhole.utilityType?.toLowerCase() ?? "telecom";
  const utilityStyle = UtilityStyles[typeKey] ?? UtilityStyles.telecom;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: utilityStyle.bg }]}>
        <Ionicons
          name={(utilityStyle.icon as any) ?? "location-outline"}
          size={20}
          color={utilityStyle.text}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.code} numberOfLines={1}>
            {manhole.code ?? "Unnamed Manhole"}
          </Text>
          {manhole.distanceMeters !== undefined && (
            <DistanceBadge meters={manhole.distanceMeters} />
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <View style={[styles.utilityTag, { backgroundColor: utilityStyle.bg }]}>
              <Text style={[styles.utilityText, { color: utilityStyle.text }]}>
                {(manhole.utilityType ?? "telecom").toUpperCase()}
              </Text>
            </View>

            <StatusBadge status={manhole.status} />
          </View>

          {manhole.lastInspectedAt && (
            <Text style={styles.inspectedText}>
              {formatRelativeDate(manhole.lastInspectedAt)}
            </Text>
          )}

          {onViewDetails && (
            <TouchableOpacity
              onPress={onViewDetails}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.eyeBtn}
            >
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DistanceBadge({ meters }: { meters: number }) {
  const isVeryClose = meters < 15;
  return (
    <View style={[styles.distanceChip, isVeryClose && styles.distanceChipClose]}>
      <Ionicons
        name="navigate-outline"
        size={11}
        color={isVeryClose ? Colors.success : Colors.primary}
        style={{ marginRight: 3 }}
      />
      <Text style={[styles.distanceText, isVeryClose && styles.distanceTextClose]}>
        {formatDistance(meters)}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isOk = status === "active";
  const isBad = status === "damaged";
  const bg = isOk ? Colors.successLight : isBad ? Colors.dangerLight : "#F1F5F9";
  const textColor = isOk ? Colors.success : isBad ? Colors.danger : Colors.textMuted;

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: textColor }]} />
      <Text style={[styles.statusBadgeText, { color: textColor }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  body: { flex: 1 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  code: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  utilityTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  utilityText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  inspectedText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textMuted,
  },
  eyeBtn: {
    paddingLeft: 6,
  },
  distanceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  distanceChipClose: {
    backgroundColor: Colors.successLight,
    borderColor: "#A7F3D0",
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  distanceTextClose: {
    color: Colors.success,
  },
});

