
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type Role = 'founder' | 'admin' | 'staff';

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles = ['founder', 'admin', 'staff'],
}: {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: Role[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  if (!allowedRoles.includes(user.role)) {
    return (
      <Route path={path}>
        <Redirect to="/unauthorized" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
