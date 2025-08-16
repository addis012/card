import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Mail, Phone, MapPin, Calendar, CreditCard, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StrowalletCustomer {
  id: string;
  userId: string;
  strowalletCustomerId: string | null;
  publicKey: string;
  firstName: string;
  lastName: string;
  customerEmail: string;
  phoneNumber: string;
  dateOfBirth: string;
  idNumber: string;
  idType: string;
  houseNumber: string;
  line1: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  idImage: string;
  userPhoto: string;
  status: 'pending' | 'created' | 'failed';
  createdAt: string;
}

export default function CustomersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    publicKey: "pub_SkVqm5mglsqS1mOkoilo06HiobYqhdibn8UehMJf",
    firstName: "",
    lastName: "",
    customerEmail: "",
    phoneNumber: "",
    dateOfBirth: "",
    idNumber: "",
    idType: "NIN",
    houseNumber: "",
    line1: "",
    city: "",
    state: "",
    zipCode: "",
    country: "ET",
    idImage: "",
    userPhoto: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers, isLoading } = useQuery<StrowalletCustomer[]>({
    queryKey: ["/api/strowallet/customers"],
    queryFn: () => apiRequest("/api/strowallet/customers")
  });

  // Create customer mutation
  const createCustomer = useMutation({
    mutationFn: (customerData: any) => apiRequest("/api/strowallet/customers", {
      method: "POST",
      body: customerData,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/strowallet/customers"] });
      setIsCreateDialogOpen(false);
      setFormData({
        publicKey: "pub_SkVqm5mglsqS1mOkoilo06HiobYqhdibn8UehMJf",
        firstName: "",
        lastName: "",
        customerEmail: "",
        phoneNumber: "",
        dateOfBirth: "",
        idNumber: "",
        idType: "NIN",
        houseNumber: "",
        line1: "",
        city: "",
        state: "",
        zipCode: "",
        country: "ET",
        idImage: "",
        userPhoto: ""
      });
      
      const result = data.strowalletResult;
      const customer = data.customer;
      
      if (result && result.success !== false && result.customer_id) {
        // StroWallet registration successful
        toast({
          title: "✅ Registration Complete",
          description: `Customer registered successfully! StroWallet ID: ${result.customer_id}. Status: Pending verification.`,
          className: "border-green-200 bg-green-50"
        });
      } else if (customer && customer.status === "failed" && result && result.message) {
        // StroWallet failed but customer saved locally
        toast({
          title: "📋 Registration Saved",
          description: `Customer saved locally. StroWallet verification pending. Error: ${result.message}`,
          className: "border-yellow-200 bg-yellow-50"
        });
      } else {
        // Generic success
        toast({
          title: "✅ Registration Complete", 
          description: "Customer registered successfully. Pending verification.",
          className: "border-green-200 bg-green-50"
        });
      }
    },
    onError: (error: any) => {
      console.error('Customer creation error:', error);
      
      // Parse error message for better user feedback
      let errorMessage = "Failed to create customer";
      if (error.message) {
        if (error.message.includes('BVN is required')) {
          errorMessage = "BVN (Bank Verification Number) is required for Nigerian customers. Please update your ID type and number.";
        } else if (error.message.includes('validation')) {
          errorMessage = "Please check all required fields and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "❌ Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomer.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
        return <Badge variant="default" className="bg-green-500">✅ Registered - Pending Verification</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 border-yellow-300">📋 Pending Registration</Badge>;
      case 'failed':
        return <Badge variant="destructive">❌ Registration Failed</Badge>;
      default:
        return <Badge variant="secondary">❓ Unknown Status</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Strowallet Customers</h1>
          <p className="text-muted-foreground">Manage customer accounts and Strowallet integration</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Strowallet Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to the Strowallet system with complete KYC information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="251911234567"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth (MM/DD/YYYY) *</Label>
                  <Input
                    id="dateOfBirth"
                    placeholder="01/15/1995"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="idType">ID Type *</Label>
                  <Select value={formData.idType} onValueChange={(value) => setFormData({ ...formData, idType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIN">National ID Number</SelectItem>
                      <SelectItem value="PASSPORT">Passport</SelectItem>
                      <SelectItem value="BVN">Bank Verification Number</SelectItem>
                      <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="idNumber">ID Number *</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="houseNumber">House Number *</Label>
                  <Input
                    id="houseNumber"
                    value={formData.houseNumber}
                    onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="line1">Address Line 1 *</Label>
                  <Input
                    id="line1"
                    value={formData.line1}
                    onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value="Ethiopia"
                  disabled
                  className="bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="idImage">ID Image URL *</Label>
                  <Input
                    id="idImage"
                    placeholder="https://example.com/id-image.jpg"
                    value={formData.idImage}
                    onChange={(e) => setFormData({ ...formData, idImage: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="userPhoto">User Photo URL *</Label>
                  <Input
                    id="userPhoto"
                    placeholder="https://example.com/user-photo.jpg"
                    value={formData.userPhoto}
                    onChange={(e) => setFormData({ ...formData, userPhoto: e.target.value })}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCustomer.isPending}>
                  {createCustomer.isPending ? "Creating..." : "Create Customer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers?.filter(c => c.status === 'created').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {customers?.filter(c => c.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {customers?.filter(c => c.status === 'failed').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers?.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {customer.firstName} {customer.lastName}
                </CardTitle>
                {getStatusBadge(customer.status)}
              </div>
              <CardDescription>
                Customer since {new Date(customer.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  {customer.customerEmail}
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {customer.phoneNumber}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  {customer.city}, {customer.state}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  DOB: {customer.dateOfBirth}
                </div>
                {customer.strowalletCustomerId && (
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                    Strowallet ID: {customer.strowalletCustomerId}
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  ID: {customer.idType} - {customer.idNumber}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customers?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first Strowallet customer to get started with card issuance.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Customer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}