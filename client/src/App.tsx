import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Cards from "@/pages/cards";
import Transactions from "@/pages/transactions";
import ApiSettings from "@/pages/api-settings";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/layout/navbar";

function Router() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/cards" component={Cards} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/api" component={ApiSettings} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
