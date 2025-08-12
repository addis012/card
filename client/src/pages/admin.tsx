import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { 
  Shield, 
  DollarSign, 
  FileCheck, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  CreditCard,
  Eye,
  Settings
} from "lucide-react";
import type { Deposit, KycDocument } from "@shared/schema";

export default function AdminPanel() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [selectedKycDoc, setSelectedKycDoc] = useState<KycDocument | null>(null);

  // Determine which content to show based on route
  const getPageTitle = () => {
    switch (location) {
      case '/admin/cards': return 'Card Management';
      case '/admin/add-money': return 'Add Money';
      case '/admin/my-cards': return 'My Cards';
      case '/admin/transactions': return 'Transaction Management';
      case '/admin/users': return 'User Management';
      case '/admin/kyc': return 'KYC Document Management';
      case '/admin/settings': return 'Admin Settings';
      default: return 'Admin Dashboard';
    }
  };

  const getPageDescription = () => {
    switch (location) {
      case '/admin/cards': return 'Manage and monitor all user cards';
      case '/admin/add-money': return 'Process deposit requests and funding';
      case '/admin/my-cards': return 'View administrative cards';
      case '/admin/transactions': return 'Monitor all platform transactions';
      case '/admin/users': return 'Manage user accounts and permissions';
      case '/admin/kyc': return 'Review and approve KYC documents';
      case '/admin/settings': return 'Configure platform settings and rates';
      default: return 'Manage deposits, KYC verification, and user accounts';
    }
  };

  // Fetch admin data
  const { data: deposits = [], isLoading: depositsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/deposits'],
  });

  const { data: kycDocuments = [], isLoading: kycLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/kyc-documents'],
  });

  // Mutations
  const updateDepositMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest(`/api/admin/deposits/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deposits'] });
      toast({
        title: "Deposit Updated",
        description: "Deposit status has been updated successfully.",
      });
      setSelectedDeposit(null);
    },
  });

  const updateKycMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest(`/api/admin/kyc-documents/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc-documents'] });
      toast({
        title: "KYC Document Updated",
        description: "KYC document status has been updated successfully.",
      });
      setSelectedKycDoc(null);
    },
  });

  const updateUserKycMutation = useMutation({
    mutationFn: async ({ userId, kycStatus }: { userId: string; kycStatus: string }) => {
      return await apiRequest(`/api/admin/users/${userId}/kyc`, "PATCH", { kycStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc-documents'] });
      toast({
        title: "User KYC Status Updated",
        description: "User KYC status has been updated successfully.",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Summary statistics
  const pendingDeposits = deposits.filter((d: Deposit) => d.status === 'pending').length;
  const totalDepositAmount = deposits.reduce((sum: number, d: Deposit) => sum + parseFloat(d.amount), 0);
  const pendingKyc = kycDocuments.filter((k: KycDocument) => k.status === 'pending').length;

  // Render different content based on current route
  const renderPageContent = () => {
    switch (location) {
      case '/admin/cards':
        return renderCardsPage();
      case '/admin/add-money':
        return renderAddMoneyPage();
      case '/admin/my-cards':
        return renderMyCardsPage();
      case '/admin/transactions':
        return renderTransactionsPage();
      case '/admin/users':
        return renderUsersPage();
      case '/admin/kyc':
        return renderKycPage();
      case '/admin/settings':
        return renderSettingsPage();
      default:
        return renderDashboardTabs(); // Default dashboard with tabs
    }
  };

  const renderCardsPage = () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Management</CardTitle>
        <CardDescription>View and manage all user cards on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Card management functionality will be implemented here.</p>
      </CardContent>
    </Card>
  );

  const renderAddMoneyPage = () => (
    <Card>
      <CardHeader>
        <CardTitle>Add Money</CardTitle>
        <CardDescription>Process deposit requests and fund user accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Add money functionality will be implemented here.</p>
      </CardContent>
    </Card>
  );

  const renderMyCardsPage = () => (
    <Card>
      <CardHeader>
        <CardTitle>My Cards</CardTitle>
        <CardDescription>View administrative cards and account information</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Administrative cards will be displayed here.</p>
      </CardContent>
    </Card>
  );

  const renderTransactionsPage = () => (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Management</CardTitle>
        <CardDescription>Monitor and manage all platform transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Transaction management functionality will be implemented here.</p>
      </CardContent>
    </Card>
  );

  const renderUsersPage = () => (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage user accounts, permissions, and status</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">User management functionality will be implemented here.</p>
      </CardContent>
    </Card>
  );

  const renderKycPage = () => (
    <Card>
      <CardHeader>
        <CardTitle>KYC Document Management</CardTitle>
        <CardDescription>Review and approve user KYC documents</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">KYC document review interface will be implemented here.</p>
      </CardContent>
    </Card>
  );

  const renderSettingsPage = () => (
    <Card>
      <CardHeader>
        <CardTitle>Admin Settings</CardTitle>
        <CardDescription>Configure platform settings, rates, and system parameters</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Admin settings interface will be implemented here.</p>
      </CardContent>
    </Card>
  );

  const renderDashboardTabs = () => (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="settings">Settings & Rates</TabsTrigger>
        <TabsTrigger value="deposits">ETB Deposits</TabsTrigger>
        <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exchange Rates & Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Exchange Rates & Fees
              </CardTitle>
              <CardDescription>
                Configure conversion rates and transaction fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="etb-rate">ETB to USDT Rate</Label>
                <Input
                  id="etb-rate"
                  placeholder="0.018"
                  defaultValue="0.018"
                  data-testid="input-etb-rate"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conversion-fee">Conversion Fee (%)</Label>
                <Input
                  id="conversion-fee"
                  placeholder="2.5"
                  defaultValue="2.5"
                  data-testid="input-conversion-fee"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction-fee">Transaction Fee (USDT)</Label>
                <Input
                  id="transaction-fee"
                  placeholder="0.50"
                  defaultValue="0.50"
                  data-testid="input-transaction-fee"
                />
              </div>
              
              <Button className="w-full" data-testid="button-save-rates">
                Save Exchange Rates
              </Button>
            </CardContent>
          </Card>

          {/* Deposit Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Deposit Settings
              </CardTitle>
              <CardDescription>
                Configure deposit limits and processing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-deposit">Minimum Deposit (ETB)</Label>
                <Input
                  id="min-deposit"
                  placeholder="100"
                  defaultValue="100"
                  data-testid="input-min-deposit"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-deposit">Maximum Deposit (ETB)</Label>
                <Input
                  id="max-deposit"
                  placeholder="50000"
                  defaultValue="50000"
                  data-testid="input-max-deposit"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="processing-time">Processing Time (hours)</Label>
                <Input
                  id="processing-time"
                  placeholder="24"
                  defaultValue="24"
                  data-testid="input-processing-time"
                />
              </div>
              
              <Button className="w-full" data-testid="button-save-deposit-settings">
                Save Deposit Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="deposits">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              ETB Deposit Management
            </CardTitle>
            <CardDescription>
              Review and process user ETB deposits. Convert approved deposits to USDT and fund user cards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Deposit management interface will be loaded here.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="kyc">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              KYC Verification
            </CardTitle>
            <CardDescription>
              Review and approve user KYC documents for card creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">KYC verification interface will be loaded here.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {getPageDescription()}
            </p>
          </div>

          {/* Summary Cards - Only show on dashboard */}
          {(location === '/admin' || location === '/admin/dashboard') && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Deposits</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingDeposits}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total ETB Volume</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDepositAmount.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending KYC</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingKyc}</p>
                    </div>
                    <FileCheck className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{kycDocuments.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Route-specific content */}
          {renderPageContent()}
        </div>
      </div>
    </div>
  );
}