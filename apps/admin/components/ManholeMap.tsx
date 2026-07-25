"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { Manhole } from "@/lib/api";
import { statusColor, StatusPip } from "./StatusPip";

export function ManholeMap({ manholes }: { manholes: Manhole[] }) {
  const center: [number, number] =
    manholes.length > 0
      ? [manholes[0].lat, manholes[0].lng]
      : [12.9716, 77.5946]; // fallback center — swap for your city

  return (
    <div className="overflow-hidden rounded-lg border border-ink-700">
      <MapContainer center={center} zoom={14} style={{ height: 480, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {manholes.map((m) => (
          <CircleMarker
            key={m.id}
            center={[m.lat, m.lng]}
            radius={8}
            pathOptions={{
              color: statusColor(m.status),
              fillColor: statusColor(m.status),
              fillOpacity: 0.65,
              weight: 2,
            }}
          >
            <Popup>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm text-mist">{m.code}</span>
                <StatusPip status={m.status} />
                <Link
                  href={`/manholes/${m.id}`}
                  className="mt-1 text-xs text-survey underline"
                >
                  View / edit
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
