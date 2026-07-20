// hooks/useRegisterController.ts
import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import NetInfo from "@react-native-community/netinfo";
import { useManholeStore } from "../store/use-manhole-store";
import { useLocationStore } from "../store/use-location-store";
import { createManhole, uploadPhoto } from "../api/manholes";
import { enqueue } from "../services/offline-queue";

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useRegisterController() {
  const { addOrUpdateManhole } = useManholeStore();
  const { currentLocation, startWatching } = useLocationStore();

  const [code, setCode] = useState("");
  const [utilityType, setUtilityType] = useState<
    "sewer" | "electrical" | "telecom" | "water" | ""
  >("");
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

  useEffect(() => {
    startWatching();
  }, [startWatching]);

  useEffect(() => {
    if (currentLocation && !capturedLocation) {
      setCapturedLocation(currentLocation);
    }
  }, [currentLocation, capturedLocation]);

  const captureGps = useCallback(async () => {
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
  }, []);

  const handlePickImage = useCallback(async () => {
    setError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Permission to access media library is required to upload a photo.",
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
      if (!result.canceled && result.assets?.[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to select photo.");
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    setError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Permission to access camera is required to take a photo.",
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
      if (!result.canceled && result.assets?.[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo.");
    }
  }, []);

  const resetForm = useCallback(() => {
    setCode("");
    setUtilityType("");
    setDepthMeters("");
    setPhotoUri(null);
    setInstallDate(getTodayString());
    setCapturedLocation(null);
  }, []);

  const handleSubmit = useCallback(async () => {
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
          `Manhole ${code ? code : "at (" + payload.lat.toFixed(4) + ", " + payload.lng.toFixed(4) + ")"} registered successfully.`,
        );
      } else {
        await enqueue({
          type: "CREATE_MANHOLE",
          payload: { ...payload, photoUrl: photoUri || undefined },
        });
        Alert.alert(
          "Queued Offline",
          "No internet connection. Registration has been queued and will sync automatically.",
        );
      }
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }, [
    capturedLocation,
    code,
    utilityType,
    depthMeters,
    installDate,
    photoUri,
    addOrUpdateManhole,
    resetForm,
  ]);

  return {
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
    setTodayDate: () => setInstallDate(getTodayString()),
  };
}
