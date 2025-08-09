import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertDepositSchema, insertKycDocumentSchema, type InsertDeposit, type InsertKycDocument } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { 
  DollarSign, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Upload,
  FileText,
  CreditCard,
  Shield,
  Eye
} from "lucide-react";

export default function Deposits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);

  const form = useForm<InsertDeposit>({
    resolver: zodResolver(insertDepositSchema),
    defaultValues: {
      amount: "",
      currency: "ETB",
      paymentMethod: "bank_transfer",
      transactionReference: "",
      adminNotes: null,
      status: "pending"
    },
  });

  const kycForm = useForm<InsertKycDocument>({
    resolver: zodResolver(insertKycDocumentSchema),
    defaultValues: {
      documentType: "passport",
      documentUrl: "",
      status: "pending"
    },
  });

  // Fetch user deposits and KYC documents
  const { data: deposits = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/deposits'],
  });

  const { data: kycDocuments = [], isLoading: kycLoading } = useQuery<any[]>({
    queryKey: ['/api/kyc-documents'],
  });

  const createDepositMutation = useMutation({
    mutationFn: async (data: InsertDeposit) => {
      return await apiRequest("/api/deposits", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deposits'] });
      toast({
        title: "Deposit Submitted",
        description: "Your ETB deposit has been submitted for review. You'll be notified once it's processed.",
      });
      setShowDepositForm(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createKycDocumentMutation = useMutation({
    mutationFn: async (data: InsertKycDocument) => {
      return await apiRequest("/api/kyc-documents", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kyc-documents'] });
      toast({
        title: "KYC Document Submitted",
        description: "Your identity document has been submitted for verification.",
      });
      setShowKycForm(false);
      kycForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const totalDeposited = deposits.filter((d: any) => d.status === 'completed')
    .reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0);
  const pendingAmount = deposits.filter((d: any) => d.status === 'pending')
    .reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0);

  // Upload handlers
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("/api/objects/upload", "POST", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      kycForm.setValue("documentUrl", uploadURL);
      
      toast({
        title: "File Uploaded",
        description: "Your document has been uploaded successfully. Please submit the form.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your ETB deposits and KYC verification documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowKycForm(true)} variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            Upload KYC
          </Button>
          <Button onClick={() => setShowDepositForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Deposit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="deposits" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposits">ETB Deposits</TabsTrigger>
          <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deposited</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalDeposited.toLocaleString()} ETB
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {pendingAmount.toLocaleString()} ETB
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deposits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{deposits.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Deposit History
          </CardTitle>
          <CardDescription>
            Track your ETB deposits and their conversion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading deposits...</div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No deposits yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by making your first ETB deposit to fund your cards
              </p>
              <Button onClick={() => setShowDepositForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Make First Deposit
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((deposit: any) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-semibold">
                      {parseFloat(deposit.amount).toLocaleString()} {deposit.currency}
                    </TableCell>
                    <TableCell className="capitalize">
                      {deposit.paymentMethod.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(deposit.status)}>
                        {getStatusIcon(deposit.status)}
                        <span className="ml-1 capitalize">{deposit.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {deposit.transactionReference || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(deposit.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {deposit.adminNotes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                KYC Documents
              </CardTitle>
              <CardDescription>
                Upload and manage your identity verification documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kycLoading ? (
                <div className="text-center py-8">Loading KYC documents...</div>
              ) : kycDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No documents uploaded</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Upload your identity documents to get verified and start using your account
                  </p>
                  <Button onClick={() => setShowKycForm(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload First Document
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Review Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycDocuments.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="capitalize">
                          {doc.documentType.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(doc.status)}>
                            {getStatusIcon(doc.status)}
                            <span className="ml-1 capitalize">{doc.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {doc.reviewNotes || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.documentUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
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

      {/* Deposit Form Modal */}
      {showDepositForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                New ETB Deposit
              </CardTitle>
              <CardDescription>
                Submit your ETB deposit for manual conversion to USDT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createDepositMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (ETB)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              placeholder="1000.00" 
                              type="number"
                              step="0.01"
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transactionReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Reference</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter bank reference or mobile money ID" 
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Processing Information
                        </p>
                        <p className="text-blue-700 dark:text-blue-200">
                          Your ETB deposit will be reviewed by our team and manually converted to USDT. 
                          The converted amount will be added to your card balance within 24 hours.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={createDepositMutation.isPending}
                    >
                      {createDepositMutation.isPending ? "Submitting..." : "Submit Deposit"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDepositForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KYC Document Upload Form Modal */}
      {showKycForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Upload KYC Document
              </CardTitle>
              <CardDescription>
                Upload your identity document for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...kycForm}>
                <form onSubmit={kycForm.handleSubmit((data) => createKycDocumentMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={kycForm.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                            <SelectItem value="national_id">National ID</SelectItem>
                            <SelectItem value="residence_permit">Residence Permit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Upload Document</Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="w-full"
                    >
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>Choose File</span>
                      </div>
                    </ObjectUploader>
                    {kycForm.watch("documentUrl") && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ✓ Document uploaded successfully
                      </p>
                    )}
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                          Document Requirements
                        </p>
                        <ul className="text-amber-700 dark:text-amber-200 space-y-1">
                          <li>• High-quality photo or scan</li>
                          <li>• All text must be clearly readable</li>
                          <li>• Document must be valid and unexpired</li>
                          <li>• Maximum file size: 10MB</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={createKycDocumentMutation.isPending || !kycForm.watch("documentUrl")}
                    >
                      {createKycDocumentMutation.isPending ? "Uploading..." : "Submit Document"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowKycForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}