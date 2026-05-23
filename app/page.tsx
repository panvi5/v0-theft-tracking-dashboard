"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Car, Bike, Truck, CircleDot, Crosshair, Shield } from "lucide-react";

const vehicleTypes = [
  { value: "bike", label: "Bike", icon: Bike },
  { value: "car", label: "Car", icon: Car },
  { value: "truck", label: "Truck", icon: Truck },
  { value: "auto", label: "Auto", icon: CircleDot },
  { value: "other", label: "Other", icon: CircleDot },
];

export default function HomePage() {
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState("");
  const [location, setLocation] = useState("");
  const [theftDateTime, setTheftDateTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = () => {
    if (!vehicleType || !location || !theftDateTime) {
      return;
    }
    
    setIsLoading(true);
    
    // Encode data and navigate to tracking page
    const params = new URLSearchParams({
      vehicle: vehicleType,
      location: location,
      time: theftDateTime,
    });
    
    setTimeout(() => {
      router.push(`/tracking?${params.toString()}`);
    }, 800);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <Shield className="w-12 h-12 text-primary" />
            <Crosshair className="w-6 h-6 text-primary absolute -bottom-1 -right-1" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Theft <span className="text-primary">Tracking</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-md mx-auto text-balance">
          Advanced crime analysis system with real-time tracking and AI-powered predictions
        </p>
      </div>

      {/* Main Card */}
      <Card className="relative z-10 w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Report Theft Details
          </CardTitle>
          <CardDescription>
            Enter the theft information to begin tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vehicle Type */}
          <div className="space-y-2">
            <Label htmlFor="vehicle-type" className="text-sm font-medium">
              Vehicle Type
            </Label>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger id="vehicle-type" className="w-full bg-input border-border">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Theft Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Theft Location
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Enter theft location address"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the exact address or landmark where the theft occurred
            </p>
          </div>

          {/* Theft Time */}
          <div className="space-y-2">
            <Label htmlFor="theft-time" className="text-sm font-medium">
              Theft Date & Time
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="theft-time"
                type="datetime-local"
                value={theftDateTime}
                onChange={(e) => setTheftDateTime(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
          </div>

          {/* Track Button */}
          <Button
            onClick={handleTrack}
            disabled={!vehicleType || !location || !theftDateTime || isLoading}
            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-red transition-all duration-300 disabled:opacity-50 disabled:glow-none"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Initializing Tracking...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5" />
                Track Location
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Feature badges */}
      <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
        {["AI Prediction", "Real-time Analysis", "Route Tracking", "CCTV Zones"].map((feature) => (
          <div
            key={feature}
            className="px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-xs text-muted-foreground"
          >
            {feature}
          </div>
        ))}
      </div>
    </main>
  );
}
