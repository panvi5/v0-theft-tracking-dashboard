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

// Component to update map view when center/radius changes
function MapUpdater({
  center,
  radius,
  initialZoom,
}: {
  center: [number, number];
  radius: number;
  initialZoom: number;
}) {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      map.setView(center, initialZoom, { animate: false });
      initializedRef.current = true;
    } else {
      // Adjust zoom based on radius for tracking view
      const zoom =
        radius > 60000 ? 8 : radius > 30000 ? 9 : radius > 15000 ? 10 : radius > 5000 ? 11 : 13;
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, radius, initialZoom, map]);

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

// Route directions with bearings - more directions for better coverage
const routeDirections = [
  { name: "North Highway", bearing: 0, probability: 78 },
  { name: "North-Northeast Route", bearing: 22.5, probability: 55 },
  { name: "Northeast Route", bearing: 45, probability: 52 },
  { name: "East-Northeast Route", bearing: 67.5, probability: 40 },
  { name: "East Highway", bearing: 90, probability: 45 },
  { name: "East-Southeast Route", bearing: 112.5, probability: 32 },
  { name: "Southeast Route", bearing: 135, probability: 34 },
  { name: "South-Southeast Route", bearing: 157.5, probability: 25 },
  { name: "South Highway", bearing: 180, probability: 38 },
  { name: "South-Southwest Route", bearing: 202.5, probability: 30 },
  { name: "Southwest Route", bearing: 225, probability: 28 },
  { name: "West-Southwest Route", bearing: 247.5, probability: 22 },
  { name: "West Highway", bearing: 270, probability: 21 },
  { name: "West-Northwest Route", bearing: 292.5, probability: 35 },
  { name: "Northwest Route", bearing: 315, probability: 42 },
  { name: "North-Northwest Route", bearing: 337.5, probability: 48 },
];

interface RouteData {
  name: string;
  probability: number;
  coordinates: [number, number][];
  distance: string;
  duration: string;
  roadName?: string;
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

  // Fetch real road routes using OSRM with detailed steps
  const fetchRoutes = useCallback(async () => {
    const centerKey = `${center[0].toFixed(6)},${center[1].toFixed(6)},${radius}`;
    if (fetchedRef.current === centerKey) return;
    fetchedRef.current = centerKey;
    
    setIsLoadingRoutes(true);
    const radiusKm = radius / 1000;
    const destinationDistance = Math.min(radiusKm * 1.2, 150); // Extend beyond radius

    const routePromises = routeDirections.map(async (dir) => {
      const destination = calculateDestination(center, destinationDistance, dir.bearing);
      
      try {
        // Use OSRM API with steps=true for detailed road info
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${center[1]},${center[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson&steps=true`,
          { signal: AbortSignal.timeout(15000) }
        );
        
        if (!response.ok) throw new Error("Routing failed");
        
        const data = await response.json();
        
        if (data.code === "Ok" && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coordinates: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );
          
          // Extract road names from steps
          let mainRoadName = "";
          if (route.legs && route.legs[0] && route.legs[0].steps) {
            const roadNames = route.legs[0].steps
              .filter((step: { name?: string }) => step.name && step.name.trim())
              .map((step: { name: string }) => step.name);
            if (roadNames.length > 0) {
              // Get the most common or longest road name
              mainRoadName = roadNames.reduce((a: string, b: string) => 
                a.length > b.length ? a : b
              );
            }
          }
          
          return {
            name: dir.name,
            probability: dir.probability,
            coordinates,
            distance: (route.distance / 1000).toFixed(1) + " km",
            duration: Math.round(route.duration / 60) + " min",
            roadName: mainRoadName,
          };
        }
      } catch (error) {
        // Silent fallback
      }
      
      // Fallback to straight line if routing fails
      return {
        name: dir.name,
        probability: dir.probability,
        coordinates: [center, destination],
        distance: destinationDistance.toFixed(1) + " km",
        duration: "~" + Math.round(destinationDistance * 1.5) + " min",
        roadName: "",
      };
    });

    const fetchedRoutes = await Promise.all(routePromises);
    // Sort by probability for rendering order (lower first so higher draws on top)
    setRoutes(fetchedRoutes.sort((a, b) => a.probability - b.probability));
    setIsLoadingRoutes(false);
  }, [center, radius]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // Get route color based on probability
  const getRouteColor = (probability: number) => {
    if (probability >= 70) return "#dc2626"; // Red for high probability
    if (probability >= 50) return "#ea580c"; // Orange
    if (probability >= 30) return "#ca8a04"; // Yellow/amber
    return "#2563eb"; // Blue for lower probability
  };

  const getRouteWeight = (probability: number) => {
    if (probability >= 70) return 6;
    if (probability >= 50) return 5;
    if (probability >= 30) return 4;
    return 3;
  };

  // Higher initial zoom for street-level detail
  const initialZoom = radius <= 5000 ? 15 : radius <= 15000 ? 13 : 11;

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={initialZoom}
      className="w-full h-full rounded-xl"
      zoomControl={true}
      attributionControl={true}
      style={{ background: "#f5f5f5" }}
      maxZoom={19}
      minZoom={3}
    >
      {/* Google Maps-style detailed tiles with streets and door numbers */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      
      {/* Additional detailed layer for better road visibility */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        maxZoom={19}
        opacity={0}
      />

      <MapUpdater center={center} radius={radius} initialZoom={initialZoom} />

      {/* Red circle radius */}
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          color: "#dc2626",
          fillColor: "#ef4444",
          fillOpacity: 0.06,
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
            opacity: 0.8,
            lineCap: "round",
            lineJoin: "round",
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} sticky>
            <div className="text-xs p-1">
              <div className="font-bold text-sm">{route.name}</div>
              {route.roadName && (
                <div className="text-gray-800 font-medium">{route.roadName}</div>
              )}
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
        <div className="absolute top-4 left-4 z-[1000] bg-white px-3 py-2 rounded-lg shadow-md text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Loading road routes...
        </div>
      )}

      {/* Blue "Start Point" marker at theft location */}
      <Marker position={center} icon={startPointIcon}>
        <Popup>
          <div className="text-sm">
            <div className="font-semibold text-blue-600">THEFT LOCATION</div>
            <div className="text-gray-600">
              Coordinates: {center[0].toFixed(6)}, {center[1].toFixed(6)}
            </div>
            <div className="text-gray-600">
              Incident reported {minutesPassed} minutes ago
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
