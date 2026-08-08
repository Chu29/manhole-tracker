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
    liveLocation,
    permissionGranted,
    submitStage,
    submitting,
    error,
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
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroSubtitle}>NEW INFRASTRUCTURE SURVEY</Text>
              <Text style={styles.heroTitle}>Register Manhole</Text>
            </View>
            <View style={styles.heroIconBadge}>
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
            </View>
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
          <View style={styles.sectionHeader}>
            <Ionicons name="navigate-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Location Details</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={Colors.primary}
              style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>GPS Coordinates</Text>
              {liveLocation ? (
                <Text style={[styles.infoValue, styles.monospace]}>
                  {liveLocation.lat.toFixed(6)}, {liveLocation.lng.toFixed(6)}
                </Text>
              ) : permissionGranted === false ? (
                <Text style={[styles.infoValue, styles.errorTextInline]}>
                  Location permission required
                </Text>
              ) : (
                <Text style={[styles.infoValue, styles.errorTextInline]}>
                  Acquiring GPS lock…
                </Text>
              )}
            </View>
            {liveLocation && (
              <View style={styles.statusBadgeSuccess}>
                <View style={styles.livePulseDot} />
                <Text style={styles.statusBadgeTextSuccess}>LIVE</Text>
              </View>
            )}
          </View>

          <Text style={styles.helperText}>
            This exact GPS location will be locked and saved for this asset.
          </Text>
        </View>

        {/* Manhole Metadata Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hardware-chip-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Manhole Metadata</Text>
          </View>

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
              <Text style={styles.infoLabel}>Depth (Meters)</Text>
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
              <Text style={styles.infoLabel}>Utility Classification</Text>
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
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isActive && styles.chipTextSelected,
                        ]}
                      >
                        {type.toUpperCase()}
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
          <View style={styles.sectionHeader}>
            <Ionicons name="camera-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Media & Installation</Text>
          </View>

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
                  activeOpacity={0.7}
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
              name="image-outline"
              size={20}
              color={Colors.textMuted}
              style={[styles.rowIcon, { marginTop: 2 }]}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Asset Photo Evidence</Text>

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
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="images-outline"
                        size={15}
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
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={15}
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
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color={Colors.danger}
                      />
                      <Text style={styles.photoActionTextDanger}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.photoPlaceholderContainer}>
                  <View style={styles.photoPlaceholderIconCircle}>
                    <Ionicons
                      name="camera"
                      size={28}
                      color={Colors.primary}
                    />
                  </View>
                  <Text style={styles.photoPlaceholderTitle}>Upload Photo Evidence</Text>
                  <Text style={styles.photoPlaceholderText}>
                    Capture a clear photo of the manhole cover and surrounding terrain.
                  </Text>
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={styles.photoSelectBtn}
                      onPress={handleTakePhoto}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="camera"
                        size={15}
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
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="images"
                        size={15}
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
          activeOpacity={0.85}
        >
          {submitStage === "saving" ? (
            <>
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Saving Asset…</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
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
  container: { paddingBottom: 40 },
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: { flex: 1 },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  rowIcon: { marginRight: 12 },
  rowContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: { fontSize: 14, fontWeight: "600", color: Colors.text },
  monospace: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  helperText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textMuted,
    marginTop: 8,
    lineHeight: 16,
  },
  errorTextInline: { color: Colors.danger, fontStyle: "italic", fontSize: 13 },
  statusBadgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  statusBadgeTextSuccess: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.success,
  },
  input: {
    height: 42,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 2,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  chipTextSelected: { color: "#fff" },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 8,
  },
  todayButton: {
    backgroundColor: Colors.primaryLight,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  todayButtonText: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
  photoContainer: {
    marginTop: 8,
    borderRadius: 14,
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
    borderColor: "#BAE6FD",
  },
  photoActionBtnDanger: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  photoActionTextSecondary: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  photoActionTextDanger: {
    color: Colors.danger,
    fontWeight: "700",
    fontSize: 12,
  },
  photoPlaceholderContainer: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    backgroundColor: Colors.background,
    padding: 20,
    alignItems: "center",
  },
  photoPlaceholderIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  photoPlaceholderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 16,
  },
  photoSelectBtn: {
    flex: 1,
    flexDirection: "row",
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  photoSelectBtnSecondary: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  photoSelectBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  photoSelectBtnTextSecondary: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  submitButton: {
    flexDirection: "row",
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: -0.2 },
  disabled: { opacity: 0.6 },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { flex: 1, color: Colors.danger, fontWeight: "600", fontSize: 14 },
});