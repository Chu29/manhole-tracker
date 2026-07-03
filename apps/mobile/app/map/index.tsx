import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { router } from "expo-router";
import { useManholeStore } from "../../store/use-manhole-store";
import { useLocationStore } from "../../store/use-location-store";
import { Colors, UtilityColors } from "../../constants/theme";
import { DEFAULT_RADIUS_METERS } from "@manhole-tracker/shared";

export default function MapScreen() {
  const { sortedList } = useManholeStore();
  const { currentLocation } = useLocationStore();
  const mapRef = useRef<MapView>(null);

  function centreOnMe() {
    if (!currentLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  }

  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  return (
    <View style={styles.container}>
      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← List</Text>
      </TouchableOpacity>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Search radius circle around the technician */}
        {currentLocation && (
          <Circle
            center={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }}
            radius={DEFAULT_RADIUS_METERS}
            strokeColor="rgba(26,110,191,0.4)"
            fillColor="rgba(26,110,191,0.07)"
          />
        )}

        {/* Manhole markers */}
        {sortedList.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            title={m.code ?? "Manhole"}
            description={
              [
                m.utilityType,
                m.distanceMeters ? `${Math.round(m.distanceMeters)} m` : null,
              ]
                .filter(Boolean)
                .join(" · ") || undefined
            }
            pinColor={
              m.utilityType ? UtilityColors[m.utilityType] : Colors.primary
            }
            onCalloutPress={() => router.push(`/nearby/${m.id}`)}
          />
        ))}
      </MapView>

      {/* Centre-on-me FAB */}
      <TouchableOpacity style={styles.fab} onPress={centreOnMe}>
        <Text style={styles.fabText}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  backButton: {
    position: "absolute",
    top: 54,
    left: 16,
    zIndex: 10,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backText: { color: Colors.primary, fontWeight: "600", fontSize: 14 },
  fab: {
    position: "absolute",
    bottom: 34,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  fabText: { fontSize: 24 },
});
