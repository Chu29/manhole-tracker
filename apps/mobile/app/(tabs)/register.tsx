import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRegisterController } from "@/hooks/useRegisterController";
import { Colors, UtilityColors } from "../../constants/theme";
import { OfflineBanner } from "../../components/offline-banner";
import { UTILITY_TYPES } from "@manhole-tracker/shared";

export default function RegisterScreen() {
  const {
    code,
    setCode,
    utilityType,
    setUtilityType,
    depthMeters,
    setDepthMeters,
    installDate,
    setInstallDate,
    photoUri,
    setPhotoUri,
    capturedLocation,
    gpsLoading,
    submitting,
    error,
    captureGps,
    handlePickImage,
    handleTakePhoto,
    handleSubmit,
    setTodayDate,
  } = useRegisterController();

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
                  {capturedLocation.lat.toFixed(6)},{" "}
                  {capturedLocation.lng.toFixed(6)}
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
                capturedLocation
                  ? styles.actionButtonSecondary
                  : styles.actionButtonPrimary,
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
                    name={
                      capturedLocation ? "refresh-outline" : "locate-outline"
                    }
                    size={18}
                    color={capturedLocation ? Colors.primary : "#fff"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      capturedLocation
                        ? styles.actionButtonTextSecondary
                        : styles.actionButtonTextPrimary,
                    ]}
                  >
                    {capturedLocation
                      ? "Re-capture GPS"
                      : "Capture GPS Location"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Manhole Metadata Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Manhole Metadata</Text>

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

          <View
            style={[
              styles.infoRow,
              { alignItems: "flex-start", paddingVertical: 12 },
            ]}
          >
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
                      onPress={() =>
                        setUtilityType(isActive ? "" : (type as any))
                      }
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
                  onPress={setTodayDate}
                >
                  <Text style={styles.todayButtonText}>Today</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View
            style={[
              styles.infoRow,
              { alignItems: "flex-start", paddingVertical: 12 },
            ]}
          >
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
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoPreview}
                  />
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={[
                        styles.photoActionBtn,
                        styles.photoActionBtnSecondary,
                      ]}
                      onPress={handlePickImage}
                    >
                      <Ionicons
                        name="images-outline"
                        size={16}
                        color={Colors.primary}
                      />
                      <Text style={styles.photoActionTextSecondary}>
                        Gallery
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.photoActionBtn,
                        styles.photoActionBtnSecondary,
                      ]}
                      onPress={handleTakePhoto}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={16}
                        color={Colors.primary}
                      />
                      <Text style={styles.photoActionTextSecondary}>
                        Retake
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.photoActionBtn,
                        styles.photoActionBtnDanger,
                      ]}
                      onPress={() => setPhotoUri(null)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={Colors.danger}
                      />
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
                      <Ionicons
                        name="camera"
                        size={16}
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.photoSelectBtnText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.photoSelectBtn,
                        styles.photoSelectBtnSecondary,
                      ]}
                      onPress={handlePickImage}
                    >
                      <Ionicons
                        name="images"
                        size={16}
                        color={Colors.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.photoSelectBtnTextSecondary}>
                        Gallery
                      </Text>
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
  container: { padding: 16, paddingBottom: 40 },
  header: { alignItems: "center", marginVertical: 20 },
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  rowIcon: { marginRight: 14 },
  rowContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  infoValue: { fontSize: 14, color: Colors.text },
  monospace: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  errorTextInline: { color: Colors.danger, fontStyle: "italic", fontSize: 14 },
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
  buttonRow: { marginTop: 12, alignItems: "stretch" },
  actionButton: {
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonPrimary: { backgroundColor: Colors.primary },
  actionButtonSecondary: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: { fontWeight: "600", fontSize: 14 },
  actionButtonTextPrimary: { color: "#fff" },
  actionButtonTextSecondary: { color: Colors.primary },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
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
  chipTextSelected: { color: "#fff" },
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
  todayButtonText: { color: Colors.primary, fontWeight: "600", fontSize: 13 },
  photoContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    overflow: "hidden",
  },
  photoPreview: { width: "100%", height: 160, resizeMode: "cover" },
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
  photoSelectBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },
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
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.6 },
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
  errorText: { flex: 1, color: Colors.danger, fontWeight: "600", fontSize: 14 },
});
