"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { differenceInMinutes } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Car,
  Bike,
  Truck,
  CircleDot,
  MapPin,
  Clock,
  Route,
  Camera,
  Fuel,
  Navigation,
  Shield,
  Radar,
  Activity,
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const TrackingMap = dynamic(() => import("./tracking-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-card">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

const vehicleIcons: Record<string, React.ElementType> = {
  bike: Bike,
  car: Car,
  truck: Truck,
  auto: CircleDot,
  other: CircleDot,
};

// Calculate radius based on time passed (in meters)
function calculateRadius(minutesPassed: number): number {
  // Base speed assumptions (km/h) that decrease over time
  // First 30 min: 40km/h, 30-120 min: 30km/h, >120 min: 20km/h
  if (minutesPassed <= 5) {
    return 3000; // 3km - small radius
  } else if (minutesPassed <= 30) {
    return 15000; // 15km - medium radius
  } else if (minutesPassed <= 120) {
    return 40000; // 40km - large radius
  } else {
    return 80000; // 80km - very large radius
  }
}

function getRadiusLabel(minutesPassed: number): string {
  if (minutesPassed <= 5) return "Small";
  if (minutesPassed <= 30) return "Medium";
  if (minutesPassed <= 120) return "Large";
  return "Extended";
}

// Mock data for AI predictions
const mockPredictions = {
  routes: [
    { id: 1, name: "NH-48 Highway (North)", probability: 78, direction: "N" },
    { id: 2, name: "State Highway 17", probability: 65, direction: "NE" },
    { id: 3, name: "Ring Road Exit 4", probability: 52, direction: "E" },
  ],
  highways: [
    { id: 1, name: "NH-48", distance: "2.3 km" },
    { id: 2, name: "NH-8", distance: "5.1 km" },
  ],
  cctvZones: [
    { id: 1, name: "Sector 14 Junction", status: "active", cameras: 4 },
    { id: 2, name: "Mall Road Intersection", status: "active", cameras: 6 },
    { id: 3, name: "Highway Toll Plaza", status: "active", cameras: 8 },
  ],
  fuelStations: [
    { id: 1, name: "HP Petroleum", distance: "1.2 km" },
    { id: 2, name: "Indian Oil", distance: "2.8 km" },
    { id: 3, name: "Bharat Petroleum", distance: "3.5 km" },
  ],
  checkpoints: [
    { id: 1, name: "State Border Checkpoint", distance: "45 km", status: "alerted" },
    { id: 2, name: "District Border Post", distance: "28 km", status: "alerted" },
  ],
};

export default function TrackingDashboard() {
  const searchParams = useSearchParams();
  const vehicle = searchParams.get("vehicle") || "car";
  const location = searchParams.get("location") || "Unknown Location";
  const theftTime = searchParams.get("time") || new Date().toISOString();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(true);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const VehicleIcon = vehicleIcons[vehicle] || Car;

  // Geocode the location to get coordinates
  useEffect(() => {
    async function geocodeLocation() {
      setIsGeocodingLoading(true);
      setGeocodeError(null);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
          {
            headers: {
              "User-Agent": "TheftTrackingApp/1.0",
            },
          }
        );
        
        if (!response.ok) {
          throw new Error("Geocoding failed");
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setCoordinates([lat, lon]);
        } else {
          setGeocodeError("Location not found. Using default.");
          // Default to a central location if geocoding fails
          setCoordinates([28.6139, 77.209]);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setGeocodeError("Geocoding failed. Using default.");
        setCoordinates([28.6139, 77.209]);
      } finally {
        setIsGeocodingLoading(false);
      }
    }
    
    if (location && location !== "Unknown Location") {
      geocodeLocation();
    } else {
      setCoordinates([28.6139, 77.209]);
      setIsGeocodingLoading(false);
    }
  }, [location]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const theftDate = useMemo(() => new Date(theftTime), [theftTime]);
  const minutesPassed = useMemo(
    () => Math.max(0, differenceInMinutes(currentTime, theftDate)),
    [currentTime, theftDate]
  );
  const radius = useMemo(() => calculateRadius(minutesPassed), [minutesPassed]);
  const radiusLabel = useMemo(() => getRadiusLabel(minutesPassed), [minutesPassed]);

  const formatTimePassed = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-semibold text-lg hidden sm:inline">Theft Tracking</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 border-primary/50 text-primary">
                <Activity className="w-3 h-3 animate-pulse" />
                Live Tracking
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map Section */}
        <div className="flex-1 relative min-h-[400px] lg:min-h-0">
          {isGeocodingLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-card">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Locating address...</p>
              </div>
            </div>
          ) : coordinates ? (
            <TrackingMap
              center={coordinates}
              radius={radius}
              minutesPassed={minutesPassed}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-card">
              <p className="text-muted-foreground">Unable to load map</p>
            </div>
          )}
          
          {/* Map overlay info */}
          <div className="absolute top-4 left-4 z-[1000]">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <VehicleIcon className="w-5 h-5 text-primary" />
                  <span className="font-medium capitalize">{vehicle}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{location}</span>
                </div>
                {geocodeError && (
                  <p className="text-xs text-yellow-500">{geocodeError}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Radius info overlay */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            <Card className="bg-card/90 backdrop-blur-sm border-primary/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <Radar className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Search Radius</p>
                    <p className="font-semibold text-lg text-primary">
                      {(radius / 1000).toFixed(1)} km
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {radiusLabel}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time passed overlay */}
          <div className="absolute top-4 right-4 z-[1000]">
            <Card className="bg-card/90 backdrop-blur-sm border-destructive/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time Elapsed</p>
                    <p className="font-semibold text-lg text-destructive">
                      {formatTimePassed(minutesPassed)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar - AI Predictions */}
        <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-card/50 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Most Probable Routes */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Route className="w-4 h-4 text-chart-2" />
                  Most Probable Routes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockPredictions.routes.map((route) => (
                  <div
                    key={route.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-2">
                      <Navigation
                        className="w-4 h-4 text-muted-foreground"
                        style={{
                          transform: `rotate(${
                            route.direction === "N" ? 0 :
                            route.direction === "NE" ? 45 :
                            route.direction === "E" ? 90 : 0
                          }deg)`,
                        }}
                      />
                      <span className="text-sm">{route.name}</span>
                    </div>
                    <Badge
                      variant={route.probability > 70 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {route.probability}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Nearby Highways */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Route className="w-4 h-4 text-chart-3" />
                  Nearby Highways
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockPredictions.highways.map((highway) => (
                  <div
                    key={highway.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                  >
                    <span className="text-sm font-medium">{highway.name}</span>
                    <span className="text-xs text-muted-foreground">{highway.distance}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* CCTV Zones */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-chart-4" />
                  CCTV Zones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockPredictions.cctvZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                  >
                    <div>
                      <p className="text-sm">{zone.name}</p>
                      <p className="text-xs text-muted-foreground">{zone.cameras} cameras</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-green-500 border-green-500/50">
                      {zone.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Fuel Stations */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-chart-5" />
                  Fuel Stations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockPredictions.fuelStations.map((station) => (
                  <div
                    key={station.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                  >
                    <span className="text-sm">{station.name}</span>
                    <span className="text-xs text-muted-foreground">{station.distance}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Border Checkpoints */}
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Border Checkpoints
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockPredictions.checkpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div>
                      <p className="text-sm">{checkpoint.name}</p>
                      <p className="text-xs text-muted-foreground">{checkpoint.distance}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      {checkpoint.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
