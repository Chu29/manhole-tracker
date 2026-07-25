"use client";

import { useState } from "react";
import Link from "next/link";
import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
import { Manhole } from "@/lib/api";
import { statusColor, StatusPip } from "./StatusPip";

export function ManholeMap({ manholes }: { manholes: Manhole[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const center =
    manholes.length > 0
      ? { lat: manholes[0].lat, lng: manholes[0].lng }
      : { lat: 12.9716, lng: 77.5946 }; // fallback center — swap for your city

  const selectedManhole = manholes.find((m) => m.id === selectedId);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-[480px] w-full items-center justify-center rounded-lg border border-ink-700 bg-ink-900 text-mist">
        <p>Google Maps API key missing. Please restart your dev server.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink-700">
      <APIProvider apiKey={apiKey}>
        <div style={{ height: 480, width: "100%" }}>
          <Map 
            defaultCenter={center} 
            defaultZoom={14} 
            disableDefaultUI={true}
          >
            {manholes.map((m) => (
              <Marker
                key={m.id}
                position={{ lat: m.lat, lng: m.lng }}
                onClick={() => setSelectedId(m.id)}
              />
            ))}

            {selectedManhole && (
              <InfoWindow
                position={{ lat: selectedManhole.lat, lng: selectedManhole.lng }}
                onCloseClick={() => setSelectedId(null)}
                pixelOffset={[0, -30]}
              >
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <span className="font-mono text-sm font-bold text-gray-800">
                    {selectedManhole.code}
                  </span>
                  <StatusPip status={selectedManhole.status} showLabel />
                  <Link
                    href={`/manholes/${selectedManhole.id}`}
                    className="mt-2 text-xs text-blue-600 underline"
                  >
                    View / edit
                  </Link>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      </APIProvider>
    </div>
  );
}
