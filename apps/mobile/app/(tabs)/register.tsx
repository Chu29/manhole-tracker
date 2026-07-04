import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { createManhole, uploadPhoto } from "../../api/manholes";
import { useManholeStore } from "../../store/use-manhole-store";
import { useLocationStore } from "../../store/use-location-store";
import { Colors, UtilityColors } from "../../constants/theme";
import { OfflineBanner } from "../../components/offline-banner";
import { enqueue } from "../../services/offline-queue";
import NetInfo from "@react-native-community/netinfo";
import { UTILITY_TYPES } from "@manhole-tracker/shared";

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RegisterScreen() {
  const { addOrUpdateManhole } = useManholeStore();
  const { currentLocation, startWatching } = useLocationStore();

  const [code, setCode] = useState("");
  const [utilityType, setUtilityType] = useState<"sewer" | "electrical" | "telecom" | "water" | "">("");
  const [depthMeters, setDepthMeters] = useState("");
  const [installDate, setInstallDate] = useState(getTodayString());
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  const [capturedLocation, setCapturedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync capturedLocation with current location from subscription initially
  useEffect(() => {
    startWatching();
  }, [startWatching]);

  useEffect(() => {
    if (currentLocation && !capturedLocation) {
      setCapturedLocation(currentLocation);
    }
  }, [currentLocation, capturedLocation]);

  async function captureGps() {
    setGpsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
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

  async function handlePickImage() {
    setError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Permission to access media library is required to upload a photo."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to select photo.");
    }
  }

  async function handleTakePhoto() {
    setError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Permission to access camera is required to take a photo."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo.");
    }
  }

  async function handleSubmit() {
    setError(null);

    if (!capturedLocation) {
      setError("Capture a GPS location first.");
      return;
    }

    if (depthMeters && isNaN(Number(depthMeters))) {
      setError("Depth must be a valid number.");
      return;
    }

    if (installDate && !/^\d{4}-\d{2}-\d{2}$/.test(installDate)) {
      setError("Installation date must be in YYYY-MM-DD format.");
      return;
    }

    const payload = {
      lat: capturedLocation.lat,
      lng: capturedLocation.lng,
      code: code.trim() || undefined,
      utilityType: (utilityType || undefined) as any,
      depthMeters: depthMeters ? Number(depthMeters) : undefined,
      installDate: installDate.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        let uploadedUrl = undefined;
        if (photoUri) {
          const { photoUrl } = await uploadPhoto(photoUri);
          uploadedUrl = photoUrl;
        }

        const manhole = await createManhole({
          ...payload,
          photoUrl: uploadedUrl,
        });
        addOrUpdateManhole(manhole);
        Alert.alert(
          "Registered",
          `Manhole ${code ? code : "at (" + payload.lat.toFixed(4) + ", " + payload.lng.toFixed(4) + ")"} registered successfully.`
        );
      } else {
        await enqueue({
          type: "CREATE_MANHOLE",
          payload: {
            ...payload,
            photoUrl: photoUri || undefined,
          },
        });
        Alert.alert(
          "Queued Offline",
          "No internet connection. Manhole registration has been queued and will sync automatically when connection returns."
        );
      }
      
      // Reset form
      setCode("");
      setUtilityType("");
      setDepthMeters("");
      setPhotoUri(null);
      setInstallDate(getTodayString());
      setCapturedLocation(null);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="add-circle" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Register Manhole</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>New Survey</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Location Details Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location Details</Text>

          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>GPS Coordinates</Text>
              {capturedLocation ? (
                <Text style={[styles.infoValue, styles.monospace]}>
                  {capturedLocation.lat.toFixed(6)}, {capturedLocation.lng.toFixed(6)}
                </Text>
              ) : (
                <Text style={[styles.infoValue, styles.errorTextInline]}>
                  No location captured yet
                </Text>
              )}
            </View>
            {capturedLocation && (
              <View style={styles.statusBadgeSuccess}>
                <Text style={styles.statusBadgeTextSuccess}>LOCKED</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                gpsLoading && styles.disabled,
                capturedLocation ? styles.actionButtonSecondary : styles.actionButtonPrimary,
              ]}
              onPress={captureGps}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <ActivityIndicator
                  size="small"
                  color={capturedLocation ? Colors.primary : "#fff"}
                />
              ) : (
                <>
                  <Ionicons
                    name={capturedLocation ? "refresh-outline" : "locate-outline"}
                    size={18}
                    color={capturedLocation ? Colors.primary : "#fff"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      capturedLocation ? styles.actionButtonTextSecondary : styles.actionButtonTextPrimary,
                    ]}
                  >
                    {capturedLocation ? "Re-capture GPS" : "Capture GPS Location"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Manhole Metadata Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Manhole Metadata</Text>

          {/* Manhole Code */}
          <View style={styles.infoRow}>
            <Ionicons
              name="barcode-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Manhole Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. MH-0042"
                placeholderTextColor={Colors.textMuted}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Depth (meters) */}
          <View style={styles.infoRow}>
            <Ionicons
              name="swap-vertical-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Depth (meters)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2.5"
                placeholderTextColor={Colors.textMuted}
                value={depthMeters}
                onChangeText={setDepthMeters}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Utility Type */}
          <View style={[styles.infoRow, { alignItems: "flex-start", paddingVertical: 12 }]}>
            <Ionicons
              name="construct-outline"
              size={20}
              color={Colors.textMuted}
              style={[styles.rowIcon, { marginTop: 2 }]}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Utility Type</Text>
              <View style={styles.chipRow}>
                {(UTILITY_TYPES as string[]).map((type) => {
                  const isActive = utilityType === type;
                  const chipColor = UtilityColors[type] || Colors.primary;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        isActive && {
                          backgroundColor: chipColor,
                          borderColor: chipColor,
                        },
                      ]}
                      onPress={() => setUtilityType(isActive ? "" : (type as any))}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isActive && styles.chipTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Media & Installation Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Media & Installation</Text>

          {/* Installation Date */}
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Installation Date</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                  value={installDate}
                  onChangeText={setInstallDate}
                />
                <TouchableOpacity
                  style={styles.todayButton}
                  onPress={() => setInstallDate(getTodayString())}
                >
                  <Text style={styles.todayButtonText}>Today</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Photo Capture */}
          <View style={[styles.infoRow, { alignItems: "flex-start", paddingVertical: 12 }]}>
            <Ionicons
              name="camera-outline"
              size={20}
              color={Colors.textMuted}
              style={[styles.rowIcon, { marginTop: 2 }]}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Manhole Photo</Text>
              
              {photoUri ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={[styles.photoActionBtn, styles.photoActionBtnSecondary]}
                      onPress={handlePickImage}
                    >
                      <Ionicons name="images-outline" size={16} color={Colors.primary} />
                      <Text style={styles.photoActionTextSecondary}>Gallery</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.photoActionBtn, styles.photoActionBtnSecondary]}
                      onPress={handleTakePhoto}
                    >
                      <Ionicons name="camera-outline" size={16} color={Colors.primary} />
                      <Text style={styles.photoActionTextSecondary}>Retake</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.photoActionBtn, styles.photoActionBtnDanger]}
                      onPress={() => setPhotoUri(null)}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                      <Text style={styles.photoActionTextDanger}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.photoPlaceholderContainer}>
                  <Ionicons
                    name="image-outline"
                    size={40}
                    color={Colors.textMuted}
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={styles.photoPlaceholderText}>
                    Capture a photo of the manhole to help locate it later.
                  </Text>
                  
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={styles.photoSelectBtn}
                      onPress={handleTakePhoto}
                    >
                      <Ionicons name="camera" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.photoSelectBtnText}>Take Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.photoSelectBtn, styles.photoSelectBtnSecondary]}
                      onPress={handlePickImage}
                    >
                      <Ionicons
                        name="images"
                        size={16}
                        color={Colors.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.photoSelectBtnTextSecondary}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.disabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitText}>Register Manhole</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginVertical: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  badge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
  },
  monospace: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  errorTextInline: {
    color: Colors.danger,
    fontStyle: "italic",
    fontSize: 14,
  },
  statusBadgeSuccess: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeTextSuccess: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.success,
  },
  buttonRow: {
    marginTop: 12,
    alignItems: "stretch",
  },
  actionButton: {
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  actionButtonTextPrimary: {
    color: "#fff",
  },
  actionButtonTextSecondary: {
    color: Colors.primary,
  },
  input: {
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  chipTextSelected: {
    color: "#fff",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  todayButton: {
    backgroundColor: Colors.primaryLight,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  todayButtonText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  photoContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  photoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    gap: 6,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: "row",
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoActionBtnSecondary: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  photoActionBtnDanger: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  photoActionTextSecondary: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 12,
  },
  photoActionTextDanger: {
    color: Colors.danger,
    fontWeight: "600",
    fontSize: 12,
  },
  photoPlaceholderContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    backgroundColor: Colors.background,
    padding: 16,
    alignItems: "center",
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 16,
  },
  photoSelectBtn: {
    flex: 1,
    flexDirection: "row",
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  photoSelectBtnSecondary: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  photoSelectBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  photoSelectBtnTextSecondary: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 12,
  },
  submitButton: {
    flexDirection: "row",
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 8,
    marginBottom: 20,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: Colors.danger,
    fontWeight: "600",
    fontSize: 14,
  },
});

