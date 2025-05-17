import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  role,
  component: Component,
}: {
  path: string;
  role?: "admin" | "student";
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if user has the required role
  if (role && user.role !== role) {
    return (
      <Route path={path}>
        <Redirect to={user.role === "admin" ? "/admin" : "/"} />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
