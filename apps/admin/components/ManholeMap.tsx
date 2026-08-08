"use client";

import { useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import { Manhole } from "@/lib/api";
import { StatusPip } from "./StatusPip";
import { MapIcon } from "./Icons";

interface ManholeMapProps {
  manholes: Manhole[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onEditClick?: (id: string) => void;
}

export function ManholeMap({ manholes, selectedId, onSelect, onEditClick }: ManholeMapProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const activeId = selectedId !== undefined ? selectedId : internalSelectedId;

  function handleSelect(id: string | null) {
    setInternalSelectedId(id);
    onSelect?.(id);
  }

  const center =
    manholes.length > 0
      ? { lat: manholes[0].lat, lng: manholes[0].lng }
      : { lat: 3.8645, lng: 11.5180 };

  const selectedManhole = manholes.find((m) => m.id === activeId);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="relative h-full w-full bg-ink-950 bg-grid-cyber">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-6 max-w-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <MapIcon className="h-6 w-6" />
            </div>
            <p className="font-display text-base font-bold text-white">
              Interactive Map Backdrop
            </p>
            <p className="text-xs text-haze">
              Google Maps API key is currently unconfigured. Set <code className="text-caution font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code className="text-sky-400 font-mono">.env.local</code> to enable satellite map tiles.
            </p>
            
            <div className="mt-4 grid grid-cols-2 gap-2 w-full text-left">
              {manholes.slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m.id)}
                  className={`rounded-xl border p-2.5 text-xs transition-all ${
                    m.id === activeId
                      ? "border-sky-400 bg-sky-500/20 text-white"
                      : "border-white/10 bg-ink-900/60 text-haze hover:border-white/20"
                  }`}
                >
                  <div className="font-mono font-bold text-white">{m.code}</div>
                  <div className="text-[10px] text-haze capitalize">{m.utilityType || "sewer"} • {m.status}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <MapLegend />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <APIProvider apiKey={apiKey}>
        <div className="h-full w-full">
          <Map
            defaultCenter={center}
            defaultZoom={14}
            disableDefaultUI={true}
            mapId="DEMO_MAP_ID"
            style={{ width: "100%", height: "100%" }}
          >
            {manholes.map((m) => {
              const isSelected = m.id === activeId;
              let pinBg = "#f59e0b"; // Inactive
              if (isSelected) {
                pinBg = "#38bdf8"; // Selected
              } else if (m.status === "active") {
                pinBg = "#34d399"; // Active
              } else if (m.status === "damaged") {
                pinBg = "#f43f5e"; // Damaged
              }
              
              return (
                <AdvancedMarker
                  key={m.id}
                  position={{ lat: m.lat, lng: m.lng }}
                  onClick={() => handleSelect(m.id)}
                >
                  <Pin background={pinBg} borderColor={isSelected ? "#0284c7" : "#ffffff"} glyphColor={isSelected ? "#0284c7" : "#ffffff"} />
                </AdvancedMarker>
              );
            })}

            {selectedManhole && (
              <InfoWindow
                position={{ lat: selectedManhole.lat, lng: selectedManhole.lng }}
                onCloseClick={() => handleSelect(null)}
                pixelOffset={[0, -30]}
              >
                <div className="flex flex-col gap-1.5 min-w-[140px] p-1">
                  <span className="font-mono text-sm font-bold text-gray-900">
                    {selectedManhole.code}
                  </span>
                  <StatusPip status={selectedManhole.status} showLabel />
                  <div className="text-[11px] text-gray-600">
                    Utility: <span className="font-semibold capitalize">{selectedManhole.utilityType || "N/A"}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (onEditClick && selectedManhole.id) {
                        onEditClick(selectedManhole.id);
                      }
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline text-left"
                  >
                    <span>View / Edit details</span>
                    <span>→</span>
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      </APIProvider>

      {/* Floating Legend */}
      <MapLegend />
    </div>
  );
}

function MapLegend() {
  return (
    <div className="glass-panel absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-4 rounded-2xl px-4 py-2 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="text-haze">Active</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
        <span className="text-haze">Damaged</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="text-haze">Inactive</span>
      </div>
      <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
        <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
        <span className="text-haze">Selected</span>
      </div>
    </div>
  );
}
