import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import { createManhole } from "../../api/manholes";
import { useManholeStore } from "../../store/use-manhole-store";
import { useLocationStore } from "../../store/use-location-store";
import { Colors } from "../../constants/theme";
import { OfflineBanner } from "../../components/offline-banner";
import { enqueue } from "../../services/offline-queue";
import NetInfo from "@react-native-community/netinfo";
import { UTILITY_TYPES } from "@manhole-tracker/shared";

export default function RegisterManholeScreen() {
  const { addOrUpdateManhole } = useManholeStore();
  const { currentLocation } = useLocationStore();

  const [code, setCode] = useState("");
  const [utilityType, setUtilityType] = useState<string>("");
  const [depthMeters, setDepthMeters] = useState("");
  const [capturedLocation, setCapturedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(currentLocation);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function captureGps() {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to capture GPS.",
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCapturedLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    } catch {
      Alert.alert("Error", "Failed to get GPS location. Try again.");
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!capturedLocation) {
      setError("Capture a GPS location before registering.");
      return;
    }

    const payload = {
      lat: capturedLocation.lat,
      lng: capturedLocation.lng,
      code: code.trim() || undefined,
      utilityType: (utilityType || undefined) as any,
      depthMeters: depthMeters ? Number(depthMeters) : undefined,
    };

    setSubmitting(true);
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        const manhole = await createManhole(payload);
        addOrUpdateManhole(manhole);
        Alert.alert(
          "Success",
          `Manhole registered${code ? ` as ${code}` : ""}.`,
          [{ text: "OK", onPress: () => router.back() }],
        );
      } else {
        await enqueue({ type: "CREATE_MANHOLE", payload });
        Alert.alert(
          "Queued offline",
          "Registration will be synced when connectivity returns.",
          [{ text: "OK", onPress: () => router.back() }],
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Register Manhole</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* GPS capture */}
        <Text style={styles.label}>GPS Location *</Text>
        {capturedLocation ? (
          <View style={styles.locationCard}>
            <Text style={styles.locationText}>
              {capturedLocation.lat.toFixed(6)},{" "}
              {capturedLocation.lng.toFixed(6)}
            </Text>
            <TouchableOpacity onPress={captureGps}>
              <Text style={styles.recaptureText}>Re-capture</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.captureButton, gpsLoading && styles.buttonDisabled]}
            onPress={captureGps}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.captureButtonText}>
                📍 Capture GPS Location
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Code */}
        <Text style={styles.label}>Manhole Code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. MH-0042"
          placeholderTextColor={Colors.textMuted}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />

        {/* Utility type */}
        <Text style={styles.label}>Utility Type</Text>
        <View style={styles.chipRow}>
          {(UTILITY_TYPES as string[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, utilityType === type && styles.chipSelected]}
              onPress={() => setUtilityType(utilityType === type ? "" : type)}
            >
              <Text
                style={[
                  styles.chipText,
                  utilityType === type && styles.chipTextSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Depth */}
        <Text style={styles.label}>Depth (meters)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2.5"
          placeholderTextColor={Colors.textMuted}
          value={depthMeters}
          onChangeText={setDepthMeters}
          keyboardType="numeric"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Register Manhole</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: { color: Colors.primary, fontSize: 14, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: "700", color: Colors.text },
  content: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
  },
  captureButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
  },
  captureButtonText: { color: Colors.primary, fontWeight: "600", fontSize: 15 },
  locationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    padding: 12,
  },
  locationText: { fontSize: 13, color: Colors.success, fontWeight: "500" },
  recaptureText: { fontSize: 13, color: Colors.primary },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },
  chipTextSelected: { color: "#fff" },
  submitButton: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  errorText: {
    color: Colors.danger,
    backgroundColor: Colors.dangerLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    fontSize: 13,
  },
});
