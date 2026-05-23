"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
    const zoom =
      radius > 60000 ? 8 : radius > 30000 ? 9 : radius > 15000 ? 10 : 11;
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, radius, map]);

  return null;
}

// Calculate destination point given distance and bearing from origin
function calculateDestination(
  origin: [number, number],
  distanceKm: number,
  bearingDeg: number
): [number, number] {
  const R = 6371; // Earth's radius in km
  const lat1 = (origin[0] * Math.PI) / 180;
  const lon1 = (origin[1] * Math.PI) / 180;
  const bearing = (bearingDeg * Math.PI) / 180;
  const d = distanceKm / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
}

// Route directions with bearings
const routeDirections = [
  { name: "North Highway", bearing: 0, probability: 78 },
  { name: "Northeast Route", bearing: 45, probability: 52 },
  { name: "East Highway", bearing: 90, probability: 45 },
  { name: "Southeast Route", bearing: 135, probability: 34 },
  { name: "South Highway", bearing: 180, probability: 38 },
  { name: "Southwest Route", bearing: 225, probability: 28 },
  { name: "West Highway", bearing: 270, probability: 21 },
  { name: "Northwest Route", bearing: 315, probability: 42 },
];

interface RouteData {
  name: string;
  probability: number;
  coordinates: [number, number][];
  distance: string;
  duration: string;
  isLoading: boolean;
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
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const fetchedRef = useRef<string>("");

  // Fetch real road routes using OSRM
  const fetchRoutes = useCallback(async () => {
    const centerKey = `${center[0].toFixed(4)},${center[1].toFixed(4)},${radius}`;
    if (fetchedRef.current === centerKey) return;
    fetchedRef.current = centerKey;
    
    setIsLoadingRoutes(true);
    const radiusKm = radius / 1000;
    const destinationDistance = Math.min(radiusKm * 1.2, 100); // Extend slightly beyond radius, max 100km

    const routePromises = routeDirections.map(async (dir) => {
      const destination = calculateDestination(center, destinationDistance, dir.bearing);
      
      try {
        // Use OSRM API for real road routing
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${center[1]},${center[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`,
          { signal: AbortSignal.timeout(10000) }
        );
        
        if (!response.ok) throw new Error("Routing failed");
        
        const data = await response.json();
        
        if (data.code === "Ok" && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coordinates: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] // GeoJSON is [lon, lat], Leaflet needs [lat, lon]
          );
          
          return {
            name: dir.name,
            probability: dir.probability,
            coordinates,
            distance: (route.distance / 1000).toFixed(1) + " km",
            duration: Math.round(route.duration / 60) + " min",
            isLoading: false,
          };
        }
      } catch (error) {
        console.log(`[v0] Route fetch failed for ${dir.name}:`, error);
      }
      
      // Fallback to straight line if routing fails
      return {
        name: dir.name,
        probability: dir.probability,
        coordinates: [center, destination],
        distance: destinationDistance.toFixed(1) + " km",
        duration: "~" + Math.round(destinationDistance * 1.5) + " min",
        isLoading: false,
      };
    });

    const fetchedRoutes = await Promise.all(routePromises);
    setRoutes(fetchedRoutes);
    setIsLoadingRoutes(false);
  }, [center, radius]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // Get route color based on probability
  const getRouteColor = (probability: number) => {
    if (probability >= 70) return "#dc2626"; // Red for high probability
    if (probability >= 50) return "#ea580c"; // Orange
    if (probability >= 30) return "#ca8a04"; // Yellow
    return "#1e3a5f"; // Dark blue for lower probability
  };

  const getRouteWeight = (probability: number) => {
    if (probability >= 70) return 5;
    if (probability >= 50) return 4;
    if (probability >= 30) return 3;
    return 2;
  };

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
      {/* Standard OpenStreetMap tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater center={center} radius={radius} />

      {/* Red circle radius */}
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

      {/* Real road routes - highlighted based on probability */}
      {routes.map((route, index) => (
        <Polyline
          key={`route-${index}`}
          positions={route.coordinates}
          pathOptions={{
            color: getRouteColor(route.probability),
            weight: getRouteWeight(route.probability),
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} sticky>
            <div className="text-xs p-1">
              <div className="font-bold text-sm">{route.name}</div>
              <div className="text-gray-700">
                Probability: <span className="font-semibold text-red-600">{route.probability}%</span>
              </div>
              <div className="text-gray-600">Distance: {route.distance}</div>
              <div className="text-gray-600">Est. Time: {route.duration}</div>
            </div>
          </Tooltip>
        </Polyline>
      ))}

      {/* Loading indicator for routes */}
      {isLoadingRoutes && (
        <div className="absolute top-4 left-4 z-[1000] bg-white px-3 py-2 rounded-lg shadow-md text-sm">
          Loading road routes...
        </div>
      )}

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
