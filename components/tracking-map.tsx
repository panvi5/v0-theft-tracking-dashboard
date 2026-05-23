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

// Fix for default marker icons in Leaflet with Next.js
const createCustomIcon = (color: string, size: number = 24, icon?: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 15px ${color}, 0 0 30px ${color}60;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.5}px;
      ">${icon || ""}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const theftIcon = createCustomIcon("#ef4444", 28);
const cctvIcon = createCustomIcon("#22c55e", 16);
const fuelIcon = createCustomIcon("#f59e0b", 16);
const checkpointIcon = createCustomIcon("#3b82f6", 18);
const highwayIcon = createCustomIcon("#8b5cf6", 14);

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
    // Adjust zoom based on radius
    const zoom =
      radius > 60000 ? 9 : radius > 30000 ? 10 : radius > 15000 ? 11 : 12;
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, radius, map]);

  return null;
}

// Animated pulsing circles with CSS animation
function PulsingRadius({
  center,
  radius,
}: {
  center: [number, number];
  radius: number;
}) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const pulseScale = 1 + Math.sin(pulse * 0.1) * 0.02;

  return (
    <>
      {/* Danger zone - outermost */}
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          color: "#dc2626",
          fillColor: "#ef4444",
          fillOpacity: 0.03,
          weight: 2,
          opacity: 0.6,
          dashArray: "15, 10",
        }}
      />
      {/* Search perimeter */}
      <Circle
        center={center}
        radius={radius * 0.75}
        pathOptions={{
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.05,
          weight: 2,
          opacity: 0.5,
          dashArray: "10, 8",
        }}
      />
      {/* Active search zone */}
      <Circle
        center={center}
        radius={radius * 0.5 * pulseScale}
        pathOptions={{
          color: "#f87171",
          fillColor: "#ef4444",
          fillOpacity: 0.08,
          weight: 2,
          opacity: 0.7,
        }}
      />
      {/* High priority zone */}
      <Circle
        center={center}
        radius={radius * 0.25}
        pathOptions={{
          color: "#fca5a5",
          fillColor: "#ef4444",
          fillOpacity: 0.12,
          weight: 3,
          opacity: 0.9,
        }}
      />
      {/* Incident epicenter */}
      <Circle
        center={center}
        radius={500}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#ef4444",
          fillOpacity: 0.3,
          weight: 2,
          opacity: 1,
        }}
      />
    </>
  );
}

// Generate realistic escape routes based on road patterns
function generateEscapeRoutes(center: [number, number], radius: number) {
  const routes = [
    // Primary escape route - Highway North (most probable)
    {
      name: "NH-44 North via Ring Road",
      probability: 78,
      color: "#ef4444",
      weight: 5,
      points: [
        center,
        [center[0] + 0.008, center[1] + 0.003] as [number, number],
        [center[0] + 0.018, center[1] + 0.008] as [number, number],
        [center[0] + 0.032, center[1] + 0.012] as [number, number],
        [center[0] + 0.048, center[1] + 0.018] as [number, number],
        [center[0] + 0.065, center[1] + 0.022] as [number, number],
        [center[0] + 0.085, center[1] + 0.028] as [number, number],
      ],
    },
    // Secondary route - East Highway
    {
      name: "NH-24 East via Noida",
      probability: 52,
      color: "#f97316",
      weight: 4,
      points: [
        center,
        [center[0] + 0.005, center[1] + 0.01] as [number, number],
        [center[0] + 0.012, center[1] + 0.025] as [number, number],
        [center[0] + 0.02, center[1] + 0.045] as [number, number],
        [center[0] + 0.028, center[1] + 0.068] as [number, number],
        [center[0] + 0.035, center[1] + 0.092] as [number, number],
      ],
    },
    // Tertiary route - South
    {
      name: "NH-48 South via Gurgaon",
      probability: 34,
      color: "#eab308",
      weight: 3,
      points: [
        center,
        [center[0] - 0.006, center[1] + 0.008] as [number, number],
        [center[0] - 0.015, center[1] + 0.018] as [number, number],
        [center[0] - 0.028, center[1] + 0.032] as [number, number],
        [center[0] - 0.045, center[1] + 0.048] as [number, number],
        [center[0] - 0.065, center[1] + 0.065] as [number, number],
      ],
    },
    // Alternative route - West
    {
      name: "Rohtak Road West",
      probability: 21,
      color: "#a3e635",
      weight: 2,
      points: [
        center,
        [center[0] + 0.003, center[1] - 0.012] as [number, number],
        [center[0] + 0.008, center[1] - 0.028] as [number, number],
        [center[0] + 0.012, center[1] - 0.048] as [number, number],
        [center[0] + 0.018, center[1] - 0.072] as [number, number],
      ],
    },
  ];
  return routes;
}

// Generate points of interest
function generatePOIs(center: [number, number]) {
  return {
    cctvZones: [
      {
        pos: [center[0] + 0.012, center[1] + 0.008] as [number, number],
        name: "CCTV Zone A - Connaught Place",
        cameras: 24,
        active: true,
      },
      {
        pos: [center[0] - 0.008, center[1] + 0.015] as [number, number],
        name: "CCTV Zone B - Karol Bagh",
        cameras: 18,
        active: true,
      },
      {
        pos: [center[0] + 0.018, center[1] - 0.012] as [number, number],
        name: "CCTV Zone C - Saket",
        cameras: 15,
        active: true,
      },
      {
        pos: [center[0] - 0.015, center[1] - 0.018] as [number, number],
        name: "CCTV Zone D - Dwarka",
        cameras: 12,
        active: false,
      },
      {
        pos: [center[0] + 0.025, center[1] + 0.022] as [number, number],
        name: "CCTV Zone E - Noida Sector 18",
        cameras: 20,
        active: true,
      },
    ],
    fuelStations: [
      {
        pos: [center[0] + 0.015, center[1] - 0.02] as [number, number],
        name: "Indian Oil - NH44",
        distance: "2.3 km",
      },
      {
        pos: [center[0] - 0.018, center[1] + 0.028] as [number, number],
        name: "HP Petrol Pump - Ring Road",
        distance: "3.5 km",
      },
      {
        pos: [center[0] + 0.035, center[1] + 0.025] as [number, number],
        name: "Bharat Petroleum - GT Road",
        distance: "5.2 km",
      },
    ],
    checkpoints: [
      {
        pos: [center[0] + 0.09, center[1] + 0.065] as [number, number],
        name: "Haryana Border Check Post",
        alerted: true,
      },
      {
        pos: [center[0] - 0.075, center[1] - 0.085] as [number, number],
        name: "UP Border Check Post",
        alerted: true,
      },
      {
        pos: [center[0] + 0.045, center[1] + 0.095] as [number, number],
        name: "Ghaziabad Toll Plaza",
        alerted: false,
      },
    ],
    highways: [
      {
        pos: [center[0] + 0.05, center[1] + 0.015] as [number, number],
        name: "NH-44 Entry",
        distance: "6.2 km",
      },
      {
        pos: [center[0] + 0.025, center[1] + 0.055] as [number, number],
        name: "NH-24 Entry",
        distance: "4.8 km",
      },
      {
        pos: [center[0] - 0.035, center[1] + 0.04] as [number, number],
        name: "NH-48 Entry",
        distance: "5.1 km",
      },
    ],
    trafficExits: [
      {
        pos: [center[0] + 0.022, center[1] + 0.01] as [number, number],
        name: "ITO Flyover Exit",
      },
      {
        pos: [center[0] - 0.012, center[1] + 0.022] as [number, number],
        name: "Dhaula Kuan Exit",
      },
      {
        pos: [center[0] + 0.008, center[1] - 0.025] as [number, number],
        name: "AIIMS Flyover Exit",
      },
    ],
  };
}

// Animated route component
function AnimatedRoute({
  route,
  index,
}: {
  route: {
    name: string;
    probability: number;
    color: string;
    weight: number;
    points: [number, number][];
  };
  index: number;
}) {
  const [animOffset, setAnimOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimOffset((o) => (o + 1) % 20);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Base route line */}
      <Polyline
        positions={route.points}
        pathOptions={{
          color: route.color,
          weight: route.weight + 4,
          opacity: 0.2,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      {/* Animated dashed overlay */}
      <Polyline
        positions={route.points}
        pathOptions={{
          color: route.color,
          weight: route.weight,
          opacity: 0.9,
          dashArray: "12, 8",
          dashOffset: String(animOffset),
          lineCap: "round",
          lineJoin: "round",
        }}
      >
        <Tooltip permanent direction="top" offset={[0, -10]} className="route-tooltip">
          <div className="bg-background/95 text-foreground px-2 py-1 rounded text-xs font-medium border border-border">
            <div className="font-semibold">{route.name}</div>
            <div className="text-muted-foreground">
              Probability: <span style={{ color: route.color }}>{route.probability}%</span>
            </div>
          </div>
        </Tooltip>
      </Polyline>
      {/* Route end marker */}
      <Circle
        center={route.points[route.points.length - 1]}
        radius={300}
        pathOptions={{
          color: route.color,
          fillColor: route.color,
          fillOpacity: 0.4,
          weight: 2,
        }}
      />
    </>
  );
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
  const pois = generatePOIs(center);

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={12}
      className="w-full h-full rounded-xl"
      zoomControl={true}
      attributionControl={false}
      style={{ background: "#0a0a0a" }}
    >
      {/* Dark themed map tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapUpdater center={center} radius={radius} />

      {/* Red tracking radius with pulse effect */}
      <PulsingRadius center={center} radius={radius} />

      {/* Animated escape routes */}
      {routes.map((route, index) => (
        <AnimatedRoute key={`route-${index}`} route={route} index={index} />
      ))}

      {/* Highway entry points */}
      {pois.highways.map((hw, index) => (
        <Marker key={`hw-${index}`} position={hw.pos} icon={highwayIcon}>
          <Popup className="custom-popup">
            <div className="text-sm">
              <div className="font-semibold">{hw.name}</div>
              <div className="text-muted-foreground">{hw.distance} from incident</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* CCTV Zone markers */}
      {pois.cctvZones.map((cctv, index) => (
        <Marker key={`cctv-${index}`} position={cctv.pos} icon={cctvIcon}>
          <Popup className="custom-popup">
            <div className="text-sm">
              <div className="font-semibold">{cctv.name}</div>
              <div className="text-muted-foreground">
                {cctv.cameras} cameras |{" "}
                <span className={cctv.active ? "text-green-500" : "text-red-500"}>
                  {cctv.active ? "Active" : "Offline"}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Fuel station markers */}
      {pois.fuelStations.map((fuel, index) => (
        <Marker key={`fuel-${index}`} position={fuel.pos} icon={fuelIcon}>
          <Popup className="custom-popup">
            <div className="text-sm">
              <div className="font-semibold">{fuel.name}</div>
              <div className="text-muted-foreground">{fuel.distance} away</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Border checkpoint markers */}
      {pois.checkpoints.map((cp, index) => (
        <Marker key={`cp-${index}`} position={cp.pos} icon={checkpointIcon}>
          <Popup className="custom-popup">
            <div className="text-sm">
              <div className="font-semibold">{cp.name}</div>
              <div className={cp.alerted ? "text-red-500" : "text-yellow-500"}>
                {cp.alerted ? "ALERTED" : "Pending Alert"}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Theft location marker - central */}
      <Marker position={center} icon={theftIcon}>
        <Popup className="custom-popup">
          <div className="text-sm">
            <div className="font-semibold text-red-500">THEFT LOCATION</div>
            <div className="text-muted-foreground">
              Incident reported {minutesPassed} minutes ago
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
