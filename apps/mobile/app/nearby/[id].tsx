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
  SafeAreaView,
  Platform,
  Clipboard,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getManholeById,
  listInspections,
  createInspection,
  updateManhole,
  uploadPhoto,
  Manhole,
  Inspection,
} from "../../api/manholes";
import { formatDistance, haversineDistance } from "../../services/geo";
import { useLocationStore } from "../../store/use-location-store";
import { useManholeStore } from "../../store/use-manhole-store";
import { Colors, UtilityColors } from "../../constants/theme";
import { OfflineBanner } from "../../components/offline-banner";
import { enqueue } from "../../services/offline-queue";
import NetInfo from "@react-native-community/netinfo";
import * as ImagePicker from "expo-image-picker";
import { UTILITY_TYPES, MANHOLE_STATUSES } from "@manhole-tracker/shared";

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return Colors.success;
    case "damaged":
      return Colors.danger;
    case "buried":
      return Colors.warning;
    case "inactive":
      return Colors.offline;
    default:
      return Colors.textMuted;
  }
}

function getUtilityIcon(type: string | null): any {
  switch (type?.toLowerCase()) {
    case "sewer":
      return "water";
    case "electrical":
      return "flash";
    case "telecom":
      return "wifi";
    case "water":
      return "water-outline";
    default:
      return "construct-outline";
  }
}

export default function ManholeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentLocation } = useLocationStore();
  const { addOrUpdateManhole } = useManholeStore();

  const [manhole, setManhole] = useState<Manhole | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [inspectionPhotoUri, setInspectionPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editCode, setEditCode] = useState("");
  const [editUtilityType, setEditUtilityType] = useState<"sewer" | "electrical" | "telecom" | "water" | "">("");
  const [editDepth, setEditDepth] = useState("");
  const [editInstallDate, setEditInstallDate] = useState("");
  const [editStatus, setEditStatus] = useState("");

  useEffect(() => {
    loadDetail();
  }, [id]);

  useEffect(() => {
    if (manhole) {
      setEditCode(manhole.code ?? "");
      setEditUtilityType(manhole.utilityType ?? "");
      setEditDepth(manhole.depthMeters ? String(manhole.depthMeters) : "");
      setEditInstallDate(manhole.installDate ?? "");
      setEditStatus(manhole.status);
    }
  }, [manhole]);

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

  async function handleUpdateCoverPhoto() {
    Alert.alert("Change Cover Photo", "Select cover photo source:", [
      { text: "Camera", onPress: () => captureCoverPhoto(true) },
      { text: "Gallery", onPress: () => captureCoverPhoto(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function captureCoverPhoto(useCamera: boolean) {
    let result;
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Camera permission is required.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Media library permission is required.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        await performUpdateCoverPhoto(uri);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to select cover photo.");
    }
  }

  async function performUpdateCoverPhoto(uri: string) {
    setLoading(true);
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        const { photoUrl } = await uploadPhoto(uri);
        const updated = await updateManhole(id, { photoUrl });
        setManhole(updated);
        addOrUpdateManhole(updated);
        Alert.alert("Success", "Cover photo updated successfully.");
      } else {
        await enqueue({
          type: "UPDATE_MANHOLE",
          manholeId: id,
          payload: { photoUrl: uri },
        });
        // Optimistically show local photo
        const localUpdated = { ...manhole!, photoUrl: uri };
        setManhole(localUpdated);
        addOrUpdateManhole(localUpdated);
        Alert.alert("Queued Offline", "Cover photo update queued and will sync when connected.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error ?? "Failed to update cover photo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateManhole() {
    if (editDepth && isNaN(Number(editDepth))) {
      Alert.alert("Invalid Input", "Depth must be a valid number.");
      return;
    }
    if (editInstallDate && !/^\d{4}-\d{2}-\d{2}$/.test(editInstallDate)) {
      Alert.alert("Invalid Input", "Installation date must be in YYYY-MM-DD format.");
      return;
    }

    const payload = {
      code: editCode.trim() || undefined,
      utilityType: (editUtilityType || undefined) as any,
      depthMeters: editDepth ? Number(editDepth) : undefined,
      installDate: editInstallDate.trim() || undefined,
      status: editStatus || undefined,
    };

    setIsUpdating(true);
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        const updated = await updateManhole(id, payload);
        setManhole(updated);
        addOrUpdateManhole(updated);
        setIsEditing(false);
        Alert.alert("Success", "Manhole details updated successfully.");
      } else {
        await enqueue({
          type: "UPDATE_MANHOLE",
          manholeId: id,
          payload,
        });
        // Optimistically update local details
        const localUpdated = {
          ...manhole!,
          code: editCode.trim() || null,
          utilityType: (editUtilityType || null) as any,
          depthMeters: editDepth ? Number(editDepth) : null,
          installDate: editInstallDate.trim() || null,
          status: editStatus || manhole!.status,
        };
        setManhole(localUpdated);
        addOrUpdateManhole(localUpdated);
        setIsEditing(false);
        Alert.alert("Queued Offline", "Updates saved locally and will sync when connection returns.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error ?? "Failed to update manhole.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handlePickInspectionImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Media library permission is required.");
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
        setInspectionPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to select photo.");
    }
  }

  async function handleTakeInspectionPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera permission is required.");
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
        setInspectionPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo.");
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
        let uploadedPhotoUrl = undefined;
        if (inspectionPhotoUri) {
          const { photoUrl } = await uploadPhoto(inspectionPhotoUri);
          uploadedPhotoUrl = photoUrl;
        }

        const inspection = await createInspection(id, {
          notes: notes.trim(),
          photoUrl: uploadedPhotoUrl,
        });

        setInspections((prev) => [inspection, ...prev]);

        // Optimistically sync last inspection details onto the active manhole view
        const updatedManhole = {
          ...manhole!,
          lastInspectedAt: inspection.createdAt,
          lastInspectedBy: "You",
        };
        setManhole(updatedManhole);
        addOrUpdateManhole(updatedManhole);
      } else {
        await enqueue({
          type: "CREATE_INSPECTION",
          manholeId: id,
          payload: {
            notes: notes.trim(),
            photoUrl: inspectionPhotoUri || undefined,
          },
        });
        Alert.alert(
          "Queued offline",
          "Inspection will be synced when you reconnect.",
        );
      }
      setNotes("");
      setInspectionPhotoUri(null);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error ?? "Failed to log inspection.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    try {
      Clipboard.setString(text);
      Alert.alert("Copied", `${label} copied to clipboard!`);
    } catch (err) {
      Alert.alert("Details", `${label}:\n${text}`);
    }
  };

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

  const liveDistance = currentLocation
    ? haversineDistance(currentLocation, { lat: manhole.lat, lng: manhole.lng })
    : manhole.distanceMeters;

  return (
    <SafeAreaView style={styles.flex}>
      <OfflineBanner />

      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitleText} numberOfLines={1}>
          {manhole.code ?? "Manhole Detail"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={styles.photoSection}>
          {manhole.photoUrl ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: manhole.photoUrl }} style={styles.photo} resizeMode="cover" />
              <TouchableOpacity style={styles.updatePhotoBadge} onPress={handleUpdateCoverPhoto}>
                <Ionicons name="camera" size={18} color="#fff" />
                <Text style={styles.updatePhotoBadgeText}>Update Cover</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoPlaceholder} onPress={handleUpdateCoverPhoto}>
              <Ionicons name="image-outline" size={32} color={Colors.textMuted} style={{ marginBottom: 6 }} />
              <Text style={styles.photoPlaceholderText}>Add Cover Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Badges Row */}
        <View style={styles.badgeContainer}>
          {manhole.utilityType && (
            <View style={[styles.badge, { backgroundColor: (UtilityColors[manhole.utilityType] ?? Colors.primary) + "15" }]}>
              <Ionicons name={getUtilityIcon(manhole.utilityType)} size={14} color={UtilityColors[manhole.utilityType] ?? Colors.primary} />
              <Text style={[styles.badgeText, { color: UtilityColors[manhole.utilityType] ?? Colors.primary }]}>
                {manhole.utilityType}
              </Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: getStatusColor(manhole.status) + "15" }]}>
            <View style={[styles.badgeDot, { backgroundColor: getStatusColor(manhole.status) }]} />
            <Text style={[styles.badgeText, { color: getStatusColor(manhole.status) }]}>
              {manhole.status}
            </Text>
          </View>
          {liveDistance !== undefined && (
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.distanceBadgeText}>
                {formatDistance(liveDistance)} away
              </Text>
            </View>
          )}
        </View>

        {/* Metadata Card */}
        <View style={styles.sectionCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Manhole Details</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
              <Ionicons name={isEditing ? "close-circle-outline" : "create-outline"} size={16} color={Colors.primary} />
              <Text style={styles.editBtnText}>{isEditing ? "Cancel" : "Edit"}</Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View>
              {/* Code */}
              <View style={styles.infoRow}>
                <Ionicons name="barcode-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Manhole Code</Text>
                  <TextInput
                    style={styles.input}
                    value={editCode}
                    onChangeText={setEditCode}
                    placeholder="e.g. MH-0042"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              <View style={styles.divider} />

              {/* Utility Type */}
              <View style={[styles.infoRow, { alignItems: "flex-start", paddingVertical: 12 }]}>
                <Ionicons name="construct-outline" size={20} color={Colors.textMuted} style={[styles.rowIcon, { marginTop: 2 }]} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Utility Type</Text>
                  <View style={styles.chipRow}>
                    {UTILITY_TYPES.map((type) => {
                      const isActive = editUtilityType === type;
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
                          onPress={() => setEditUtilityType(isActive ? "" : type as any)}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextSelected]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Status */}
              <View style={[styles.infoRow, { alignItems: "flex-start", paddingVertical: 12 }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textMuted} style={[styles.rowIcon, { marginTop: 2 }]} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <View style={styles.chipRow}>
                    {MANHOLE_STATUSES.map((status) => {
                      const isActive = editStatus === status;
                      const statusColor = getStatusColor(status);
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.chip,
                            isActive && {
                              backgroundColor: statusColor,
                              borderColor: statusColor,
                            },
                          ]}
                          onPress={() => setEditStatus(status)}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextSelected]}>
                            {status.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Depth */}
              <View style={styles.infoRow}>
                <Ionicons name="swap-vertical-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Depth (meters)</Text>
                  <TextInput
                    style={styles.input}
                    value={editDepth}
                    onChangeText={setEditDepth}
                    placeholder="e.g. 2.5"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.divider} />

              {/* Install Date */}
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Installation Date</Text>
                  <View style={styles.dateInputContainer}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginTop: 0 }]}
                      value={editInstallDate}
                      onChangeText={setEditInstallDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <TouchableOpacity
                      style={styles.todayButton}
                      onPress={() => setEditInstallDate(getTodayString())}
                    >
                      <Text style={styles.todayButtonText}>Today</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, isUpdating && styles.disabled]}
                onPress={handleUpdateManhole}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-sharp" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Code */}
              <View style={styles.infoRow}>
                <Ionicons name="barcode-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Code</Text>
                  <Text style={styles.infoValue}>{manhole.code ?? "—"}</Text>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Utility Type */}
              <View style={styles.infoRow}>
                <Ionicons name="construct-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Utility</Text>
                  <Text style={[styles.infoValue, { textTransform: "capitalize" }]}>{manhole.utilityType ?? "—"}</Text>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Status */}
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(manhole.status) }]} />
                    <Text style={[styles.infoValue, { textTransform: "uppercase", fontWeight: "600", fontSize: 13, color: getStatusColor(manhole.status) }]}>
                      {manhole.status}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Depth */}
              <View style={styles.infoRow}>
                <Ionicons name="swap-vertical-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Depth</Text>
                  <Text style={styles.infoValue}>{manhole.depthMeters ? `${manhole.depthMeters} m` : "—"}</Text>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Install Date */}
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Install Date</Text>
                  <Text style={styles.infoValue}>{manhole.installDate ?? "—"}</Text>
                </View>
              </View>
              <View style={styles.divider} />

              {/* GPS Coordinates */}
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>GPS Coordinates</Text>
                  <Text style={[styles.infoValue, styles.monospace]}>{manhole.lat.toFixed(6)}, {manhole.lng.toFixed(6)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => copyToClipboard(`${manhole.lat.toFixed(6)}, ${manhole.lng.toFixed(6)}`, "GPS Coordinates")}
                  style={styles.copyBtn}
                >
                  <Ionicons name="copy-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />

              {/* Last Inspected */}
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.infoLabel}>Last Inspected</Text>
                  <Text style={styles.infoValue}>
                    {manhole.lastInspectedAt
                      ? `${new Date(manhole.lastInspectedAt).toLocaleDateString()} by ${manhole.lastInspectedBy ?? "Technician"}`
                      : "Never"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Log Inspection Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Log New Inspection</Text>
          
          <TextInput
            style={styles.notesInput}
            placeholder="Write inspection notes here..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />

          {/* Photo attachment for inspection */}
          <Text style={[styles.infoLabel, { marginBottom: 6 }]}>Inspection Photo (Optional)</Text>
          
          {inspectionPhotoUri ? (
            <View style={styles.attachmentContainer}>
              <Image source={{ uri: inspectionPhotoUri }} style={styles.attachmentPreview} />
              <TouchableOpacity
                style={styles.removeAttachmentBtn}
                onPress={() => setInspectionPhotoUri(null)}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.attachBtnRow}>
              <TouchableOpacity style={styles.attachBtn} onPress={handleTakeInspectionPhoto}>
                <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                <Text style={styles.attachBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachBtn} onPress={handlePickInspectionImage}>
                <Ionicons name="images-outline" size={18} color={Colors.primary} />
                <Text style={styles.attachBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, (submitting || !notes.trim()) && styles.disabled]}
            onPress={handleLogInspection}
            disabled={submitting || !notes.trim()}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.submitButtonText}>Submit Inspection</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Inspection History */}
        <Text style={[styles.sectionTitle, { marginLeft: 4, marginBottom: 12 }]}>Inspection History</Text>
        {inspections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={32} color={Colors.textMuted} style={{ marginBottom: 6 }} />
            <Text style={styles.emptyText}>No inspections logged yet.</Text>
          </View>
        ) : (
          inspections.map((log) => (
            <View key={log.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyTechInfo}>
                  <Ionicons name="person-circle-outline" size={24} color={Colors.textMuted} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.historyTechLabel}>Technician</Text>
                    <Text style={[styles.historyTechId, styles.monospace]}>{log.technicianId.substring(0, 8)}...</Text>
                  </View>
                </View>
                <Text style={styles.historyDate}>
                  {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.historyNotes}>{log.notes ?? "(No notes provided)"}</Text>

              {log.photoUrl && (
                <Image
                  source={{ uri: log.photoUrl }}
                  style={styles.historyPhoto}
                  resizeMode="cover"
                />
              )}
            </View>
          ))
        )}
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: { color: Colors.danger, fontSize: 15, marginBottom: 16, textAlign: "center" },
  link: { color: Colors.primary, fontSize: 14, fontWeight: "600" },
  
  // Header bar
  headerBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBackBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
    textAlign: "center",
  },
  
  // Photo Section
  photoSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  photoContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  updatePhotoBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(28, 35, 51, 0.75)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  updatePhotoBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  photoPlaceholder: {
    height: 150,
    width: "100%",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  photoPlaceholderText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  
  // Badges
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.border + "40",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  distanceBadgeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Cards
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
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  
  // Info Rows
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
  copyBtn: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  
  // Editing Inputs
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
  saveBtn: {
    backgroundColor: Colors.success,
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
  
  // Log Inspection Style
  notesInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: "top",
    marginTop: 8,
    marginBottom: 12,
  },
  attachmentContainer: {
    position: "relative",
    width: 100,
    height: 75,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  attachmentPreview: {
    width: "100%",
    height: "100%",
  },
  removeAttachmentBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  attachBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  attachBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  
  // History Style
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  historyTechInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyTechLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  historyTechId: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "600",
  },
  historyDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  historyNotes: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 8,
    lineHeight: 20,
  },
  historyPhoto: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginTop: 12,
  },
});
