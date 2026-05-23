"use client";

import { Suspense } from "react";
import TrackingDashboard from "@/components/tracking-dashboard";

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading tracking system...</p>
        </div>
      </div>
    }>
      <TrackingDashboard />
    </Suspense>
  );
}
