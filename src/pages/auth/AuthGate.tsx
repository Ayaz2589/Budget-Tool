import { Navigate, Outlet } from "react-router-dom";
import { useGoogleAuth } from "@/context";
import { LoginPage } from "./LoginPage";

/**
 * When not signed in, redirects to /auth. Otherwise renders the child routes (Layout + pages).
 */
export function AuthGate() {
  const { isSignedIn } = useGoogleAuth();

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

/**
 * Renders LoginPage at /auth. When already signed in, redirects to /.
 */
export function AuthLoginRoute() {
  const { isSignedIn } = useGoogleAuth();

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}
