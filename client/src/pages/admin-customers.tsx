import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, CreditCard, User, FileText } from "lucide-react";
import type { User as UserType, Card as CardType, KycDocument, StrowalletCustomer } from "@shared/schema";

export default function AdminCustomers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<UserType | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch all users/customers
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Fetch customer details when selected
  const { data: customerDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['/api/admin/users', selectedCustomer?.id, 'details'],
    enabled: !!selectedCustomer?.id,
  });

  const { data: customerCards = [] } = useQuery({
    queryKey: ['/api/admin/users', selectedCustomer?.id, 'cards'],
    enabled: !!selectedCustomer?.id,
  });

  const { data: customerKyc = [] } = useQuery({
    queryKey: ['/api/admin/users', selectedCustomer?.id, 'kyc'],
    enabled: !!selectedCustomer?.id,
  });

  const { data: strowalletData } = useQuery({
    queryKey: ['/api/admin/users', selectedCustomer?.id, 'strowallet'],
    enabled: !!selectedCustomer?.id,
  });

  const filteredCustomers = customers.filter((customer: UserType) => {
    const matchesSearch = 
      customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || customer.kycStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  if (loadingCustomers) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="title-admin-customers">Customer Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all customer accounts and details</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1" data-testid="badge-customer-count">
          {customers.length} Total Customers
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search customers by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-customer-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending KYC</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            Complete customer database with KYC status and account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Cards</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer: UserType) => (
                <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium" data-testid={`text-customer-name-${customer.id}`}>
                        {customer.firstName} {customer.lastName}
                      </span>
                      <span className="text-sm text-gray-500" data-testid={`text-customer-username-${customer.id}`}>
                        @{customer.username}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-customer-email-${customer.id}`}>
                    {customer.email}
                  </TableCell>
                  <TableCell data-testid={`text-customer-phone-${customer.id}`}>
                    {customer.phone || 'Not provided'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusBadgeVariant(customer.kycStatus)}
                      data-testid={`badge-kyc-status-${customer.id}`}
                    >
                      {customer.kycStatus}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`text-customer-cards-${customer.id}`}>
                    0 {/* TODO: Count from cards query */}
                  </TableCell>
                  <TableCell data-testid={`text-customer-joined-${customer.id}`}>
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCustomer(customer)}
                      className="flex items-center gap-2"
                      data-testid={`button-view-customer-${customer.id}`}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Details Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Details: {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogTitle>
            <DialogDescription>
              Complete customer information and account status
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="space-y-4">
              <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
              <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p data-testid="text-customer-full-name">
                      {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Username</label>
                    <p data-testid="text-customer-username-detail">@{selectedCustomer?.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p data-testid="text-customer-email-detail">{selectedCustomer?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p data-testid="text-customer-phone-detail">
                      {selectedCustomer?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <Badge variant="outline" data-testid="badge-customer-role">
                      {selectedCustomer?.role}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Created</label>
                    <p data-testid="text-customer-created-date">
                      {selectedCustomer && new Date(selectedCustomer.createdAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* KYC Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    KYC Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Verification Status</label>
                    <div className="mt-1">
                      <Badge 
                        variant={getStatusBadgeVariant(selectedCustomer?.kycStatus || '')}
                        data-testid="badge-kyc-status-detail"
                      >
                        {selectedCustomer?.kycStatus}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Documents Uploaded</label>
                    <p data-testid="text-kyc-documents-count">
                      {customerKyc.length} document(s)
                    </p>
                  </div>
                  {customerKyc.length > 0 && (
                    <div className="space-y-2">
                      {customerKyc.map((doc: KycDocument) => (
                        <div key={doc.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm" data-testid={`text-kyc-doc-type-${doc.id}`}>
                            {doc.documentType}
                          </span>
                          <Badge 
                            variant={getStatusBadgeVariant(doc.status)}

                            data-testid={`badge-kyc-doc-status-${doc.id}`}
                          >
                            {doc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cards Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="w-5 h-5" />
                    Card Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customerCards.length === 0 ? (
                    <p className="text-gray-500" data-testid="text-no-cards">No cards issued</p>
                  ) : (
                    <div className="space-y-3">
                      {customerCards.map((card: CardType) => (
                        <div key={card.id} className="p-3 border rounded-lg" data-testid={`card-info-${card.id}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium" data-testid={`text-card-number-${card.id}`}>
                                {card.maskedNumber || 'Card Number Hidden'}
                              </p>
                              <p className="text-sm text-gray-500" data-testid={`text-card-type-${card.id}`}>
                                {card.cardType} • {card.currency}
                              </p>
                              <p className="text-sm text-gray-500" data-testid={`text-card-name-${card.id}`}>
                                {card.nameOnCard}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={card.status === 'active' ? 'default' : 'secondary'}
                                data-testid={`badge-card-status-${card.id}`}
                              >
                                {card.status}
                              </Badge>
                              <p className="text-sm mt-1" data-testid={`text-card-balance-${card.id}`}>
                                Balance: {card.balance} {card.currency}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Strowallet Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Strowallet Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  {strowalletData ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Strowallet Customer ID</label>
                        <p data-testid="text-strowallet-customer-id">
                          {strowalletData.strowalletCustomerId || 'Not created'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <Badge 
                          variant={strowalletData.status === 'created' ? 'default' : 'secondary'}
                          data-testid="badge-strowallet-status"
                        >
                          {strowalletData.status}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500" data-testid="text-no-strowallet">
                      No Strowallet profile created
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}