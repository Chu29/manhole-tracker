import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, UtilityColors, UtilityStyles } from "../../constants/theme";
import { formatDistance } from "../../services/geo";
import { Manhole } from "../../api/manholes";

interface MapSelectedCardProps {
  manhole: Manhole;
  onNavigate: (id: string) => void;
  getUtilityIcon: (
    type: string | null,
  ) => React.ComponentProps<typeof Ionicons>["name"];
  getStatusColor: (status: string) => string;
  formatRelativeDate: (iso: string) => string;
}

export const MapSelectedCard = React.memo(
  ({
    manhole,
    onNavigate,
    getUtilityIcon,
    getStatusColor,
    formatRelativeDate,
  }: MapSelectedCardProps) => {
    const statusColor = getStatusColor(manhole.status);
    const typeKey = manhole.utilityType?.toLowerCase() ?? "telecom";
    const utilityStyle = UtilityStyles[typeKey] ?? UtilityStyles.telecom;

    return (
      <TouchableOpacity
        style={styles.selectedCard}
        onPress={() => onNavigate(manhole.id)}
        activeOpacity={0.88}
      >
        <View style={styles.selectedCardHeader}>
          <View
            style={[
              styles.utilityIconCircle,
              { backgroundColor: utilityStyle.bg },
            ]}
          >
            <Ionicons
              name={utilityStyle.icon as any}
              size={20}
              color={utilityStyle.text}
            />
          </View>

          <View style={styles.selectedCardInfo}>
            <Text style={styles.selectedCardCode} numberOfLines={1}>
              {manhole.code ?? "Unnamed Manhole"}
            </Text>
            <View style={styles.selectedCardMeta}>
              <Text style={[styles.utilityTag, { color: utilityStyle.text }]}>
                {typeKey.toUpperCase()}
              </Text>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: statusColor + "15", borderColor: statusColor + "30" },
                ]}
              >
                <View
                  style={[
                    styles.statusDotSmall,
                    { backgroundColor: statusColor },
                  ]}
                />
                <Text style={[styles.statusTextSmall, { color: statusColor }]}>
                  {manhole.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {manhole.distanceMeters !== undefined && (
            <View
              style={[
                styles.distanceBadge,
                manhole.distanceMeters < 15 && styles.distanceBadgeClose,
              ]}
            >
              <Ionicons
                name="navigate-outline"
                size={11}
                color={manhole.distanceMeters < 15 ? "#166534" : Colors.primary}
              />
              <Text
                style={[
                  styles.distanceBadgeText,
                  manhole.distanceMeters < 15 && styles.distanceBadgeTextClose,
                ]}
              >
                {formatDistance(manhole.distanceMeters)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.detailGrid}>
          {manhole.depthMeters != null && (
            <View style={styles.detailItem}>
              <Ionicons
                name="resize-outline"
                size={14}
                color={Colors.primary}
              />
              <Text style={styles.detailLabel}>Depth:</Text>
              <Text style={styles.detailValue}>{manhole.depthMeters}m</Text>
            </View>
          )}
          {manhole.lastInspectedAt && (
            <View style={styles.detailItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={Colors.primary}
              />
              <Text style={styles.detailLabel}>Inspected:</Text>
              <Text style={styles.detailValue}>
                {formatRelativeDate(manhole.lastInspectedAt)}
              </Text>
            </View>
          )}
          {manhole.installDate && (
            <View style={styles.detailItem}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={Colors.primary}
              />
              <Text style={styles.detailLabel}>Installed:</Text>
              <Text style={styles.detailValue}>{manhole.installDate}</Text>
            </View>
          )}
        </View>

        <View style={styles.viewDetailBtn}>
          <Text style={styles.viewDetailText}>View Full Asset Details</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  },
);
MapSelectedCard.displayName = "MapSelectedCard";

const styles = StyleSheet.create({
  selectedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  selectedCardHeader: { flexDirection: "row", alignItems: "center" },
  utilityIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedCardInfo: { flex: 1 },
  selectedCardCode: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  selectedCardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  utilityTag: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  statusTextSmall: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  distanceBadgeClose: { backgroundColor: "#DCFCE7" },
  distanceBadgeText: { fontSize: 11, fontWeight: "800", color: Colors.primary },
  distanceBadgeTextClose: { color: "#166534" },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
  },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  detailValue: { fontSize: 12, fontWeight: "700", color: Colors.text },
  viewDetailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  viewDetailText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});

