import { Navigate } from "react-router-dom";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { RETURNING_USER_KEY } from "@/context/GoogleAuthContext";
import { TOUR_COMPLETED_KEY } from "@/context/GoogleAuthContext";
import { LandingPage } from "./LandingPage";

function isReturningUser(): boolean {
  try {
    return !!localStorage.getItem(RETURNING_USER_KEY);
  } catch {
    return false;
  }
}

function isTourCompleted(): boolean {
  try {
    return !!localStorage.getItem(TOUR_COMPLETED_KEY);
  } catch {
    return false;
  }
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
