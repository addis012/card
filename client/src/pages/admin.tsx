import { useState } from "react";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [selectedKycDoc, setSelectedKycDoc] = useState<KycDocument | null>(null);

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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage deposits, KYC verification, and user accounts
          </p>
        </div>

        {/* Summary Cards */}
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
                {depositsLoading ? (
                  <div className="text-center py-8">Loading deposits...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deposits.map((deposit: Deposit) => (
                        <TableRow key={deposit.id}>
                          <TableCell className="font-mono text-sm">{deposit.userId}</TableCell>
                          <TableCell className="font-semibold">{deposit.amount} {deposit.currency}</TableCell>
                          <TableCell className="capitalize">{deposit.paymentMethod.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(deposit.status)}>
                              {getStatusIcon(deposit.status)}
                              <span className="ml-1">{deposit.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(deposit.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedDeposit(deposit)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  KYC Document Verification
                </CardTitle>
                <CardDescription>
                  Review and approve user KYC documents for account verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {kycLoading ? (
                  <div className="text-center py-8">Loading KYC documents...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kycDocuments.map((doc: KycDocument) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-mono text-sm">{doc.userId}</TableCell>
                          <TableCell className="capitalize">{doc.documentType.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(doc.status)}>
                              {getStatusIcon(doc.status)}
                              <span className="ml-1">{doc.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedKycDoc(doc)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Deposit Review Modal */}
        {selectedDeposit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>Review Deposit</CardTitle>
                <CardDescription>
                  Process ETB deposit and convert to USDT for user card
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount</Label>
                    <p className="font-semibold">{selectedDeposit.amount} {selectedDeposit.currency}</p>
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <p className="capitalize">{selectedDeposit.paymentMethod.replace('_', ' ')}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Transaction Reference</Label>
                  <p>{selectedDeposit.transactionReference || 'N/A'}</p>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={selectedDeposit.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea 
                    placeholder="Add notes about this deposit..."
                    defaultValue={selectedDeposit.adminNotes || ''}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      updateDepositMutation.mutate({
                        id: selectedDeposit.id,
                        updates: { status: 'completed', adminNotes: 'Approved and converted to USDT' }
                      });
                    }}
                    className="flex-1"
                    disabled={updateDepositMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Convert
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateDepositMutation.mutate({
                        id: selectedDeposit.id,
                        updates: { status: 'failed', adminNotes: 'Rejected - Invalid deposit' }
                      });
                    }}
                    className="flex-1"
                    disabled={updateDepositMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDeposit(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KYC Review Modal */}
        {selectedKycDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>Review KYC Document</CardTitle>
                <CardDescription>
                  Verify user identity document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Document Type</Label>
                    <p className="capitalize">{selectedKycDoc.documentType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label>Submitted</Label>
                    <p>{new Date(selectedKycDoc.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Document URL</Label>
                  <p className="text-sm text-blue-600 break-all">{selectedKycDoc.documentUrl}</p>
                </div>

                <div>
                  <Label htmlFor="review-notes">Review Notes</Label>
                  <Textarea 
                    placeholder="Add notes about this document review..."
                    defaultValue={selectedKycDoc.reviewNotes || ''}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      updateKycMutation.mutate({
                        id: selectedKycDoc.id,
                        updates: { status: 'approved', reviewNotes: 'Document verified successfully' }
                      });
                      updateUserKycMutation.mutate({
                        userId: selectedKycDoc.userId,
                        kycStatus: 'approved'
                      });
                    }}
                    className="flex-1"
                    disabled={updateKycMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateKycMutation.mutate({
                        id: selectedKycDoc.id,
                        updates: { status: 'rejected', reviewNotes: 'Document not clear or invalid' }
                      });
                      updateUserKycMutation.mutate({
                        userId: selectedKycDoc.userId,
                        kycStatus: 'rejected'
                      });
                    }}
                    className="flex-1"
                    disabled={updateKycMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedKycDoc(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}