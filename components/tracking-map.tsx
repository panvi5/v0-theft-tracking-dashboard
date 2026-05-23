"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Circle, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Next.js
const createCustomIcon = (color: string, size: number = 24) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px ${color}, 0 0 20px ${color}40;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const theftIcon = createCustomIcon("#ef4444", 20);
const cctvIcon = createCustomIcon("#22c55e", 14);
const fuelIcon = createCustomIcon("#f59e0b", 14);
const checkpointIcon = createCustomIcon("#3b82f6", 16);

// Component to update map view when radius changes
function MapUpdater({ center, radius }: { center: [number, number]; radius: number }) {
  const map = useMap();
  
  useEffect(() => {
    // Adjust zoom based on radius
    const zoom = radius > 50000 ? 9 : radius > 20000 ? 10 : radius > 10000 ? 11 : 12;
    map.setView(center, zoom);
  }, [center, radius, map]);
  
  return null;
}

// Animated pulsing circles
function PulsingRadius({
  center,
  radius,
}: {
  center: [number, number];
  radius: number;
}) {
  return (
    <>
      {/* Outer glow */}
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.05,
          weight: 1,
          opacity: 0.3,
        }}
      />
      {/* Middle ring */}
      <Circle
        center={center}
        radius={radius * 0.75}
        pathOptions={{
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.08,
          weight: 1,
          opacity: 0.4,
        }}
      />
      {/* Inner ring */}
      <Circle
        center={center}
        radius={radius * 0.5}
        pathOptions={{
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.1,
          weight: 2,
          opacity: 0.5,
        }}
      />
      {/* Core */}
      <Circle
        center={center}
        radius={radius * 0.25}
        pathOptions={{
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.15,
          weight: 2,
          opacity: 0.7,
        }}
      />
    </>
  );
}

// Mock points of interest based on center
function generateMockPOIs(center: [number, number], radius: number) {
  const pois = {
    cctvs: [
      [center[0] + 0.01, center[1] + 0.015],
      [center[0] - 0.008, center[1] + 0.02],
      [center[0] + 0.015, center[1] - 0.01],
      [center[0] - 0.02, center[1] - 0.015],
      [center[0] + 0.025, center[1] + 0.008],
    ],
    fuelStations: [
      [center[0] + 0.012, center[1] - 0.018],
      [center[0] - 0.015, center[1] + 0.025],
      [center[0] + 0.03, center[1] + 0.02],
    ],
    checkpoints: [
      [center[0] + 0.08, center[1] + 0.06],
      [center[0] - 0.07, center[1] - 0.08],
    ],
    escapeRoutes: [
      // Route 1 - North
      [
        center,
        [center[0] + 0.01, center[1] + 0.005],
        [center[0] + 0.025, center[1] + 0.01],
        [center[0] + 0.05, center[1] + 0.02],
        [center[0] + 0.08, center[1] + 0.025],
      ],
      // Route 2 - Northeast  
      [
        center,
        [center[0] + 0.008, center[1] + 0.012],
        [center[0] + 0.02, center[1] + 0.03],
        [center[0] + 0.04, center[1] + 0.05],
        [center[0] + 0.06, center[1] + 0.08],
      ],
      // Route 3 - East
      [
        center,
        [center[0] + 0.003, center[1] + 0.015],
        [center[0] + 0.005, center[1] + 0.035],
        [center[0] + 0.008, center[1] + 0.06],
        [center[0] + 0.01, center[1] + 0.09],
      ],
    ],
  };
  return pois;
}

interface TrackingMapProps {
  center: [number, number];
  radius: number;
  minutesPassed: number;
}

export default function TrackingMap({ center, radius, minutesPassed }: TrackingMapProps) {
  const mapRef = useRef<L.Map>(null);
  const pois = generateMockPOIs(center, radius);

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={12}
      className="w-full h-full"
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <MapUpdater center={center} radius={radius} />
      
      {/* Red tracking radius */}
      <PulsingRadius center={center} radius={radius} />
      
      {/* Theft location marker */}
      <Marker position={center} icon={theftIcon} />
      
      {/* Escape routes */}
      {pois.escapeRoutes.map((route, index) => (
        <Polyline
          key={`route-${index}`}
          positions={route as [number, number][]}
          pathOptions={{
            color: index === 0 ? "#ef4444" : index === 1 ? "#f97316" : "#eab308",
            weight: 3,
            opacity: 0.7,
            dashArray: "10, 10",
          }}
        />
      ))}
      
      {/* CCTV markers */}
      {pois.cctvs.map((pos, index) => (
        <Marker
          key={`cctv-${index}`}
          position={pos as [number, number]}
          icon={cctvIcon}
        />
      ))}
      
      {/* Fuel station markers */}
      {pois.fuelStations.map((pos, index) => (
        <Marker
          key={`fuel-${index}`}
          position={pos as [number, number]}
          icon={fuelIcon}
        />
      ))}
      
      {/* Checkpoint markers */}
      {pois.checkpoints.map((pos, index) => (
        <Marker
          key={`checkpoint-${index}`}
          position={pos as [number, number]}
          icon={checkpointIcon}
        />
      ))}
    </MapContainer>
  );
}
