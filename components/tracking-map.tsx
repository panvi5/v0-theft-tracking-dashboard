"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Polyline,
  useMap,
  Popup,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Blue "Start Point" marker like in the reference
const startPointIcon = L.divIcon({
  className: "start-point-marker",
  html: `
    <div style="position: relative;">
      <div style="
        background: #3b82f6;
        color: white;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
        top: -40px;
        left: -30px;
      ">Start Point</div>
      <div style="
        width: 16px;
        height: 16px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        position: absolute;
        top: -8px;
        left: -8px;
      "></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Component to update map view when radius changes
function MapUpdater({
  center,
  radius,
}: {
  center: [number, number];
  radius: number;
}) {
  const map = useMap();

  useEffect(() => {
    // Adjust zoom based on radius to show the full circle
    const zoom =
      radius > 60000 ? 8 : radius > 30000 ? 9 : radius > 15000 ? 10 : 11;
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, radius, map]);

  return null;
}

// Generate escape routes extending outward from center
function generateEscapeRoutes(center: [number, number], radius: number) {
  const radiusDeg = radius / 111000; // Convert meters to degrees approximately
  
  const routes = [
    // North route
    {
      name: "NH-44 North Highway",
      probability: 78,
      color: "#1e3a5f",
      points: [
        center,
        [center[0] + radiusDeg * 0.3, center[1] + radiusDeg * 0.05] as [number, number],
        [center[0] + radiusDeg * 0.6, center[1] + radiusDeg * 0.1] as [number, number],
        [center[0] + radiusDeg * 0.9, center[1] + radiusDeg * 0.12] as [number, number],
        [center[0] + radiusDeg * 1.2, center[1] + radiusDeg * 0.15] as [number, number],
      ],
    },
    // Northeast route
    {
      name: "NH-24 East via Noida",
      probability: 52,
      color: "#1e3a5f",
      points: [
        center,
        [center[0] + radiusDeg * 0.2, center[1] + radiusDeg * 0.25] as [number, number],
        [center[0] + radiusDeg * 0.4, center[1] + radiusDeg * 0.5] as [number, number],
        [center[0] + radiusDeg * 0.55, center[1] + radiusDeg * 0.75] as [number, number],
        [center[0] + radiusDeg * 0.7, center[1] + radiusDeg * 1.0] as [number, number],
      ],
    },
    // East route
    {
      name: "GT Road East",
      probability: 45,
      color: "#1e3a5f",
      points: [
        center,
        [center[0] + radiusDeg * 0.05, center[1] + radiusDeg * 0.35] as [number, number],
        [center[0] + radiusDeg * 0.08, center[1] + radiusDeg * 0.7] as [number, number],
        [center[0] + radiusDeg * 0.1, center[1] + radiusDeg * 1.1] as [number, number],
      ],
    },
    // Southeast route
    {
      name: "Agra Road South",
      probability: 34,
      color: "#1e3a5f",
      points: [
        center,
        [center[0] - radiusDeg * 0.15, center[1] + radiusDeg * 0.3] as [number, number],
        [center[0] - radiusDeg * 0.35, center[1] + radiusDeg * 0.6] as [number, number],
        [center[0] - radiusDeg * 0.55, center[1] + radiusDeg * 0.85] as [number, number],
      ],
    },
    // South route
    {
      name: "NH-48 South via Gurgaon",
      probability: 38,
      color: "#1e3a5f",
      points: [
        center,
        [center[0] - radiusDeg * 0.3, center[1] + radiusDeg * 0.1] as [number, number],
        [center[0] - radiusDeg * 0.6, center[1] + radiusDeg * 0.15] as [number, number],
        [center[0] - radiusDeg * 0.95, center[1] + radiusDeg * 0.2] as [number, number],
      ],
    },
    // Southwest route
    {
      name: "Jaipur Highway",
      probability: 28,
      color: "#1e3a5f",
      points: [
        center,
        [center[0] - radiusDeg * 0.25, center[1] - radiusDeg * 0.2] as [number, number],
        [center[0] - radiusDeg * 0.5, center[1] - radiusDeg * 0.45] as [number, number],
        [center[0] - radiusDeg * 0.8, center[1] - radiusDeg * 0.7] as [number, number],
      ],
    },
    // West route
    {
      name: "Rohtak Road West",
      probability: 21,
      color: "#1e3a5f",
      points: [
        center,
        [center[0] + radiusDeg * 0.05, center[1] - radiusDeg * 0.35] as [number, number],
        [center[0] + radiusDeg * 0.08, center[1] - radiusDeg * 0.7] as [number, number],
        [center[0] + radiusDeg * 0.1, center[1] - radiusDeg * 1.1] as [number, number],
      ],
    },
    // Northwest route
    {
      name: "Chandigarh Highway",
      probability: 42,
      color: "#1e3a5f",
      points: [
        center,
        [center[0] + radiusDeg * 0.2, center[1] - radiusDeg * 0.25] as [number, number],
        [center[0] + radiusDeg * 0.45, center[1] - radiusDeg * 0.5] as [number, number],
        [center[0] + radiusDeg * 0.7, center[1] - radiusDeg * 0.75] as [number, number],
      ],
    },
  ];
  return routes;
}

interface TrackingMapProps {
  center: [number, number];
  radius: number;
  minutesPassed: number;
}

export default function TrackingMap({
  center,
  radius,
  minutesPassed,
}: TrackingMapProps) {
  const mapRef = useRef<L.Map>(null);
  const routes = generateEscapeRoutes(center, radius);

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={10}
      className="w-full h-full rounded-xl"
      zoomControl={true}
      attributionControl={true}
      style={{ background: "#f5f5f5" }}
    >
      {/* Standard light map tiles like in the reference */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater center={center} radius={radius} />

      {/* Single red circle radius - stroke only like reference */}
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          color: "#dc2626",
          fillColor: "#ef4444",
          fillOpacity: 0.08,
          weight: 3,
          opacity: 0.9,
        }}
      />

      {/* Escape routes extending outward - dark blue/purple lines */}
      {routes.map((route, index) => (
        <Polyline
          key={`route-${index}`}
          positions={route.points}
          pathOptions={{
            color: route.color,
            weight: 2,
            opacity: 0.7,
            lineCap: "round",
            lineJoin: "round",
          }}
        >
          <Tooltip direction="top" offset={[0, -5]}>
            <div className="text-xs">
              <div className="font-semibold">{route.name}</div>
              <div className="text-gray-600">Probability: {route.probability}%</div>
            </div>
          </Tooltip>
        </Polyline>
      ))}

      {/* Blue "Start Point" marker at theft location */}
      <Marker position={center} icon={startPointIcon}>
        <Popup>
          <div className="text-sm">
            <div className="font-semibold text-blue-600">THEFT LOCATION</div>
            <div className="text-gray-600">
              Incident reported {minutesPassed} minutes ago
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
