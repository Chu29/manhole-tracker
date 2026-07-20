import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, UtilityColors } from "../../constants/theme";
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

    return (
      <TouchableOpacity
        style={styles.selectedCard}
        onPress={() => onNavigate(manhole.id)}
        activeOpacity={0.7}
      >
        <View style={styles.selectedCardHeader}>
          <View
            style={[
              styles.utilityIconCircle,
              {
                backgroundColor: manhole.utilityType
                  ? UtilityColors[manhole.utilityType] + "18"
                  : Colors.primaryLight,
              },
            ]}
          >
            <Ionicons
              name={getUtilityIcon(manhole.utilityType)}
              size={20}
              color={
                manhole.utilityType
                  ? UtilityColors[manhole.utilityType]
                  : Colors.primary
              }
            />
          </View>
          <View style={styles.selectedCardInfo}>
            <Text style={styles.selectedCardCode} numberOfLines={1}>
              {manhole.code ?? "Unnamed Manhole"}
            </Text>
            <View style={styles.selectedCardMeta}>
              {manhole.utilityType && (
                <Text
                  style={[
                    styles.utilityTag,
                    {
                      color:
                        UtilityColors[manhole.utilityType] ?? Colors.primary,
                    },
                  ]}
                >
                  {manhole.utilityType.toUpperCase()}
                </Text>
              )}
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDotSmall,
                    { backgroundColor: statusColor },
                  ]}
                />
                <Text style={[styles.statusTextSmall, { color: statusColor }]}>
                  {manhole.status}
                </Text>
              </View>
            </View>
          </View>
          {manhole.distanceMeters !== undefined && (
            <View
              style={[
                styles.distanceBadge,
                manhole.distanceMeters < 10 && styles.distanceBadgeClose,
              ]}
            >
              <Text
                style={[
                  styles.distanceBadgeText,
                  manhole.distanceMeters < 10 && styles.distanceBadgeTextClose,
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
                color={Colors.textMuted}
              />
              <Text style={styles.detailLabel}>Depth</Text>
              <Text style={styles.detailValue}>{manhole.depthMeters}m</Text>
            </View>
          )}
          {manhole.lastInspectedAt && (
            <View style={styles.detailItem}>
              <Ionicons
                name="checkmark-circle-outline"
                size={14}
                color={Colors.textMuted}
              />
              <Text style={styles.detailLabel}>Inspected</Text>
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
                color={Colors.textMuted}
              />
              <Text style={styles.detailLabel}>Installed</Text>
              <Text style={styles.detailValue}>{manhole.installDate}</Text>
            </View>
          )}
        </View>

        <View style={styles.viewDetailRow}>
          <Text style={styles.viewDetailText}>View Full Details</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  selectedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCardHeader: { flexDirection: "row", alignItems: "center" },
  utilityIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedCardInfo: { flex: 1 },
  selectedCardCode: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  selectedCardMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  utilityTag: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusDotSmall: { width: 7, height: 7, borderRadius: 4 },
  statusTextSmall: { fontSize: 12, fontWeight: "500" },
  distanceBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceBadgeClose: { backgroundColor: Colors.successLight },
  distanceBadgeText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  distanceBadgeTextClose: { color: Colors.success },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 8,
  },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  detailLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailValue: { fontSize: 13, fontWeight: "600", color: Colors.text },
  viewDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 6,
  },
  viewDetailText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
});
