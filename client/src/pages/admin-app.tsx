import { Switch, Route } from "wouter";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import AdminLogin from "@/pages/admin-login";
import AdminPanel from "@/pages/admin";
import AdminCustomers from "@/pages/admin-customers";
import NotFound from "@/pages/not-found";

function AdminRoutes() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <Switch>
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin/dashboard" component={AdminPanel} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/cards" component={AdminPanel} />
      <Route path="/admin/add-money" component={AdminPanel} />
      <Route path="/admin/my-cards" component={AdminPanel} />
      <Route path="/admin/transactions" component={AdminPanel} />
      <Route path="/admin/users" component={AdminCustomers} />
      <Route path="/admin/kyc" component={AdminPanel} />
      <Route path="/admin/settings" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminRoutes />
    </AdminAuthProvider>
  );
}