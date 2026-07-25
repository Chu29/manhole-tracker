import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Manhole } from "../api/manholes";
import { formatDistance } from "../services/geo";
import { Colors, UtilityColors } from "../constants/theme";

interface Props {
  manhole: Manhole;
  onPress: () => void;
  onViewDetails?: () => void;
}

export function ManholeListItem({ manhole, onPress, onViewDetails }: Props) {
  const utilityColor = manhole.utilityType
    ? (UtilityColors[manhole.utilityType] ?? Colors.primary)
    : Colors.textMuted;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.code} numberOfLines={1}>
            {manhole.code ?? "Unnamed manhole"}
          </Text>
          {manhole.distanceMeters !== undefined && (
            <DistanceBadge meters={manhole.distanceMeters} />
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            {manhole.utilityType && (
              <Text style={[styles.tag, { color: utilityColor }]}>
                {manhole.utilityType.toUpperCase()}
              </Text>
            )}
            <StatusDot status={manhole.status} />
            {manhole.lastInspectedAt && (
              <Text style={styles.inspectedText}>
                Inspected {formatRelativeDate(manhole.lastInspectedAt)}
              </Text>
            )}
          </View>

          {onViewDetails && (
            <TouchableOpacity
              onPress={onViewDetails}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.eyeIconWrapper}
            >
              <Ionicons name="eye" size={28} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DistanceBadge({ meters }: { meters: number }) {
  const isClose = meters < 10;
  return (
    <View style={[styles.badge, isClose && styles.badgeClose]}>
      <Text style={[styles.badgeText, isClose && styles.badgeTextClose]}>
        {formatDistance(meters)}
      </Text>
    </View>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active"
      ? Colors.success
      : status === "damaged"
        ? Colors.danger
        : Colors.textMuted;
  return (
    <View style={styles.statusRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  stripe: { width: 5 },
  body: { flex: 1, padding: 14 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  code: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  eyeIconWrapper: {
    paddingLeft: 8,
  },
  tag: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12 },
  inspectedText: { fontSize: 12, color: Colors.textMuted },
  badge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeClose: { backgroundColor: Colors.successLight },
  badgeText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  badgeTextClose: { color: Colors.success },
});
