import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/dashboard";
import Cards from "@/pages/cards";
import Transactions from "@/pages/transactions";
import ApiSettings from "@/pages/api-settings";
import Register from "@/pages/register";
import Login from "@/pages/login";
import AdminPanel from "@/pages/admin";
import Deposits from "@/pages/deposits";
import CardAddress from "@/pages/card-address";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { useState } from "react";
import LandingPage from "@/pages/landing";

function AuthenticatedRoutes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-80 min-h-screen">
        <main className="p-4 lg:p-8">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/cards" component={Cards} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/deposits" component={Deposits} />
            <Route path="/api" component={ApiSettings} />
            <Route path="/admin" component={AdminPanel} />
            <Route path="/cards/:id/address" component={CardAddress} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function PublicRoutes() {
  return (
    <div className="min-h-screen">
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={LandingPage} />
      </Switch>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedRoutes /> : <PublicRoutes />;
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
