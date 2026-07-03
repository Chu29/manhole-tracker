import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  getManholeById,
  listInspections,
  createInspection,
  Manhole,
  Inspection,
} from "../../api/manholes";
import { formatDistance } from "../../services/geo";
import { useLocationStore } from "../../store/use-location-store";
import { haversineDistance } from "../../services/geo";
import { Colors, UtilityColors } from "../../constants/theme";
import { OfflineBanner } from "../../components/offline-banner";
import { enqueue } from "../../services/offline-queue";
import NetInfo from "@react-native-community/netinfo";

export default function ManholeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentLocation } = useLocationStore();

  const [manhole, setManhole] = useState<Manhole | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDetail();
  }, [id]);

  async function loadDetail() {
    setLoading(true);
    setError(null);
    try {
      const [m, logs] = await Promise.all([
        getManholeById(id),
        listInspections(id),
      ]);
      setManhole(m);
      setInspections(logs);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to load manhole details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogInspection() {
    if (!notes.trim()) {
      Alert.alert(
        "Notes required",
        "Please add notes before logging the inspection.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        const inspection = await createInspection(id, { notes: notes.trim() });
        setInspections((prev) => [inspection, ...prev]);
      } else {
        await enqueue({
          type: "CREATE_INSPECTION",
          payload: { notes: notes.trim() },
        });
        Alert.alert(
          "Queued offline",
          "Inspection will be synced when you reconnect.",
        );
      }
      setNotes("");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error ?? "Failed to log inspection.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !manhole) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Manhole not found."}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const utilityColor = manhole.utilityType
    ? (UtilityColors[manhole.utilityType] ?? Colors.primary)
    : Colors.primary;

  const liveDistance = currentLocation
    ? haversineDistance(currentLocation, { lat: manhole.lat, lng: manhole.lng })
    : manhole.distanceMeters;

  return (
    <View style={styles.container}>
      <OfflineBanner />

      {/* Back + header stripe */}
      <View style={[styles.headerStripe, { backgroundColor: utilityColor }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {manhole.code ?? "Manhole Detail"}
        </Text>
        {liveDistance !== undefined && (
          <Text style={styles.headerDistance}>
            {formatDistance(liveDistance)} away
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Photo */}
        {manhole.photoUrl && (
          <Image
            source={{ uri: manhole.photoUrl }}
            style={styles.photo}
            resizeMode="cover"
          />
        )}

        {/* Metadata card */}
        <View style={styles.card}>
          <Row label="Code" value={manhole.code ?? "—"} />
          <Row label="Utility" value={manhole.utilityType ?? "—"} />
          <Row label="Status" value={manhole.status} />
          <Row
            label="Depth"
            value={manhole.depthMeters ? `${manhole.depthMeters} m` : "—"}
          />
          <Row label="Install date" value={manhole.installDate ?? "—"} />
          <Row
            label="GPS"
            value={`${manhole.lat.toFixed(6)}, ${manhole.lng.toFixed(6)}`}
          />
          <Row
            label="Last inspected"
            value={
              manhole.lastInspectedAt
                ? new Date(manhole.lastInspectedAt).toLocaleDateString()
                : "Never"
            }
          />
        </View>

        {/* Log new inspection */}
        <Text style={styles.sectionTitle}>Log Inspection</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.notesInput}
            placeholder="Inspection notes…"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleLogInspection}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log Inspection</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Inspection history */}
        <Text style={styles.sectionTitle}>Inspection History</Text>
        {inspections.length === 0 ? (
          <Text style={styles.emptyText}>No inspections logged yet.</Text>
        ) : (
          inspections.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <Text style={styles.logDate}>
                {new Date(log.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.logNotes}>{log.notes ?? "(no notes)"}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  headerStripe: { paddingTop: 54, paddingBottom: 16, paddingHorizontal: 16 },
  backButton: { marginBottom: 6 },
  backText: { color: "#fff", fontSize: 14, opacity: 0.85 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerDistance: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  content: { padding: 16, paddingBottom: 40 },
  photo: { width: "100%", height: 200, borderRadius: 10, marginBottom: 16 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: { fontSize: 14, color: Colors.textMuted },
  rowValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  button: {
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  logCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  logDate: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  logNotes: { fontSize: 14, color: Colors.text },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: "italic",
    marginBottom: 16,
  },
  errorText: { color: Colors.danger, fontSize: 15, marginBottom: 16 },
  link: { color: Colors.primary, fontSize: 14 },
});
