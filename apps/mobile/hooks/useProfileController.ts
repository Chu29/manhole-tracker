// hooks/useProfileController.ts
import { useEffect, useState, useCallback } from "react";
import { Alert, Clipboard } from "react-native";
import { useAuthStore } from "../store/use-auth-store";
import { useLocationStore } from "../store/use-location-store";
import { useManholeStore } from "../store/use-manhole-store";
import { getPendingCount, flushQueue } from "../services/offline-queue";

export function useProfileController() {
  const { token, technician, logout } = useAuthStore();
  const { stopWatching } = useLocationStore();
  const { cachedManholes } = useManholeStore();
  const [pendingCount, setPendingCount] = useState(0);
  const [flushing, setFlushing] = useState(false);

  useEffect(() => {
    getPendingCount().then(setPendingCount);
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          stopWatching();
          await logout();
        },
      },
    ]);
  }, [stopWatching, logout]);

  const handleFlush = useCallback(async () => {
    setFlushing(true);
    try {
      await flushQueue();
      const remaining = await getPendingCount();
      setPendingCount(remaining);
      Alert.alert(
        "Sync complete",
        remaining === 0
          ? "All items uploaded successfully."
          : `${remaining} item(s) still pending — check your connection.`,
      );
    } catch (err) {
      Alert.alert(
        "Sync failed",
        "A network error occurred. Please try again later.",
      );
    } finally {
      setFlushing(false);
    }
  }, []);

  const copyToClipboard = useCallback((text: string, label: string) => {
    try {
      Clipboard.setString(text);
      Alert.alert("Copied", `${label} copied to clipboard!`);
    } catch (err) {
      Alert.alert("Details", `${label}:\n${text}`);
    }
  }, []);

  const initials = technician?.name
    ? technician.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

  const formattedDate = technician?.createdAt
    ? new Date(technician.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return {
    token,
    technician,
    cachedManholesCount: cachedManholes.length,
    pendingCount,
    flushing,
    initials,
    formattedDate,
    handleLogout,
    handleFlush,
    copyToClipboard,
  };
}
