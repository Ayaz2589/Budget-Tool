import { Navigate } from "react-router-dom";
import { useGoogleAuth } from "@/context";
import { RETURNING_USER_KEY } from "@/context";
import { TOUR_COMPLETED_KEY } from "@/context";
import { storage } from "@/lib/platform/storage";
import { LandingPage } from "./LandingPage";

function isReturningUser(): boolean {
  return !!storage.getItem(RETURNING_USER_KEY);
}

function isTourCompleted(): boolean {
  return !!storage.getItem(TOUR_COMPLETED_KEY);
}

/**
 * Renders at /. If signed in → redirect to /dashboard.
 * If not signed in and returning user (flag set) → redirect to /auth.
 * Else (new visitor) → show LandingPage.
 */
export function LandingRoute() {
  const { isSignedIn } = useGoogleAuth();

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isTourCompleted()) {
    return <Navigate to="/tour" replace />;
  }

  if (isReturningUser()) {
    return <Navigate to="/auth" replace />;
  }

  return <LandingPage />;
}
