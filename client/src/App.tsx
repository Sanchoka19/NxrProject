
import { Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import UnauthorizedPage from "@/pages/unauthorized-page";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ClientsPage from "@/pages/clients-page";
import BookingsPage from "@/pages/bookings-page";
import ServicesPage from "@/pages/services-page";
import OrganizationPage from "@/pages/organization-page";
import { Route } from "wouter";

function Router() {
  return (
    <Switch>
      <ProtectedRoute 
        path="/" 
        component={DashboardPage} 
        allowedRoles={['founder', 'admin', 'staff']} 
      />
      <ProtectedRoute 
        path="/clients" 
        component={ClientsPage} 
        allowedRoles={['founder', 'admin', 'staff']} 
      />
      <ProtectedRoute 
        path="/bookings" 
        component={BookingsPage} 
        allowedRoles={['founder', 'admin', 'staff']} 
      />
      <ProtectedRoute 
        path="/services" 
        component={ServicesPage} 
        allowedRoles={['founder', 'admin', 'staff']} 
      />
      <ProtectedRoute 
        path="/organization" 
        component={OrganizationPage} 
        allowedRoles={['founder', 'admin']} 
      />
      <Route path="/auth" component={AuthPage} />
      <Route path="/unauthorized" component={UnauthorizedPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
