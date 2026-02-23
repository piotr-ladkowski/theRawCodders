import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Navigate } from "react-router-dom";
import { Spinner } from "./ui/spinner";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const currentUser = useQuery(api.auth.currentUser);

  // Loading state
  if (currentUser === undefined) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="size-12" />
      </div>
    );
  }

  // User is not authenticated or is null
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Check if user has proper role
  const userRole = currentUser.role || "user";
  
  if (userRole === "user") {
    // Regular users should not access dashboard
    return <Navigate to="/" replace />;
  }

  // Admin or manager can access
  return <>{children}</>;
}
