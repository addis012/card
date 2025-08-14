import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, 
  Plus, 
  Eye, 
  Wallet, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User
} from "lucide-react";
import type { Card as CardType, Transaction, User as UserType } from "@shared/schema";

export default function UserDashboard() {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Fetch user's cards
  const { data: cards = [], isLoading: loadingCards } = useQuery({
    queryKey: ['/api/cards'],
  });

  // Fetch recent transactions
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['/api/transactions'],
  });

  // Fetch Strowallet customer data
  const { data: strowalletData } = useQuery({
    queryKey: ['/api/strowallet/customer'],
  });

  // Card creation mutation
  const createCardMutation = useMutation({
    mutationFn: async (cardData: { nameOnCard: string; cardType: string; amount: string }) => {
      return apiRequest('/api/cards/production', 'POST', {
        userId: user?.id,
        nameOnCard: cardData.nameOnCard,
        customerEmail: user?.email,
        ...cardData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Card Creation Initiated",
        description: "Your card is being created. This may take a few minutes.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
    },
    onError: (error: any) => {
      toast({
        title: "Card Creation Failed",
        description: error.message || "Unable to create card. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'frozen': return 'destructive';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getKycProgress = () => {
    if (!user) return 0;
    switch (user.kycStatus) {
      case 'pending': return 50;
      case 'approved': return 100;
      case 'rejected': return 25;
      default: return 0;
    }
  };

  const totalBalance = cards.reduce((sum: number, card: CardType) => 
    sum + parseFloat(card.balance || '0'), 0
  );

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="title-welcome">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-blue-200" data-testid="subtitle-dashboard">
            Manage your cards and track your spending
          </p>
        </div>

        {/* Account Status Card */}
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="w-5 h-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium" data-testid="text-account-status">
                  KYC Verification: {user?.kycStatus}
                </p>
                <p className="text-blue-200 text-sm">
                  {user?.kycStatus === 'approved' 
                    ? "Your account is fully verified" 
                    : user?.kycStatus === 'pending'
                    ? "Verification in progress"
                    : "Verification required"}
                </p>
              </div>
              <Badge 
                variant={getStatusBadgeVariant(user?.kycStatus || '')}
                data-testid="badge-kyc-status"
              >
                {user?.kycStatus}
              </Badge>
            </div>
            <Progress 
              value={getKycProgress()} 
              className="h-2" 
              data-testid="progress-kyc"
            />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Total Balance</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-balance">
                    ${totalBalance.toFixed(2)}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Active Cards</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-active-cards">
                    {cards.filter((card: CardType) => card.status === 'active').length}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">This Month</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-monthly-transactions">
                    {transactions.length}
                  </p>
                  <p className="text-blue-200 text-xs">Transactions</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards Section */}
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Your Cards</CardTitle>
              <CardDescription className="text-blue-200">
                Manage your virtual and physical cards
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={user?.kycStatus !== 'approved'}
                  data-testid="button-create-card"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Card</DialogTitle>
                  <DialogDescription>
                    Create a new virtual or physical card for your spending needs
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-center">
                    <Button
                      onClick={() => createCardMutation.mutate({
                        nameOnCard: `${user?.firstName} ${user?.lastName}`,
                        cardType: 'virtual',
                        amount: '100'
                      })}
                      disabled={createCardMutation.isPending}
                      className="w-full"
                      data-testid="button-create-virtual-card"
                    >
                      {createCardMutation.isPending ? "Creating..." : "Create Virtual Card"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loadingCards ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse bg-white/5 h-24 rounded-lg"></div>
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-white text-lg font-medium" data-testid="text-no-cards">No cards yet</p>
                <p className="text-blue-200" data-testid="text-no-cards-description">
                  {user?.kycStatus === 'approved' 
                    ? "Create your first card to get started"
                    : "Complete KYC verification to create cards"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card: CardType) => (
                  <Card 
                    key={card.id} 
                    className="bg-gradient-to-br from-blue-600 to-purple-600 border-0 text-white cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedCard(card)}
                    data-testid={`card-${card.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-blue-100 text-sm">
                            {card.cardType} Card
                          </p>
                          <p className="font-mono text-lg" data-testid={`text-card-number-${card.id}`}>
                            {card.maskedNumber || '•••• •••• •••• ••••'}
                          </p>
                        </div>
                        <Badge 
                          variant={getStatusBadgeVariant(card.status)}
                          className="bg-white/20"
                          data-testid={`badge-card-status-${card.id}`}
                        >
                          {card.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-blue-100 text-xs">Balance</p>
                          <p className="text-xl font-bold" data-testid={`text-card-balance-${card.id}`}>
                            ${card.balance} {card.currency}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-blue-100 text-xs">Name</p>
                          <p className="text-sm" data-testid={`text-card-name-${card.id}`}>
                            {card.nameOnCard || 'Card Holder'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription className="text-blue-200">
              Your latest card activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-white/5 h-16 rounded-lg"></div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-white text-lg font-medium" data-testid="text-no-transactions">No transactions yet</p>
                <p className="text-blue-200" data-testid="text-no-transactions-description">
                  Start using your cards to see transactions here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction: Transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                        transaction.type === 'purchase' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.type === 'deposit' ? '↓' :
                         transaction.type === 'purchase' ? '→' : '↑'}
                      </div>
                      <div>
                        <p className="text-white font-medium" data-testid={`text-transaction-merchant-${transaction.id}`}>
                          {transaction.merchant}
                        </p>
                        <p className="text-blue-200 text-sm" data-testid={`text-transaction-date-${transaction.id}`}>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'deposit' ? 'text-green-400' : 'text-white'
                      }`} data-testid={`text-transaction-amount-${transaction.id}`}>
                        {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                      </p>
                      <Badge 
                        variant={getStatusBadgeVariant(transaction.status)}
                        size="sm"
                        data-testid={`badge-transaction-status-${transaction.id}`}
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Details Modal */}
        <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Card Details</DialogTitle>
              <DialogDescription>
                View your card information and settings
              </DialogDescription>
            </DialogHeader>
            {selectedCard && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-lg text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-blue-100 text-sm">
                        {selectedCard.cardType} Card
                      </p>
                      <p className="font-mono text-lg" data-testid="text-modal-card-number">
                        {selectedCard.maskedNumber || '•••• •••• •••• ••••'}
                      </p>
                    </div>
                    <Badge 
                      variant={getStatusBadgeVariant(selectedCard.status)}
                      className="bg-white/20"
                      data-testid="badge-modal-card-status"
                    >
                      {selectedCard.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-blue-100 text-xs">Balance</p>
                      <p className="text-xl font-bold" data-testid="text-modal-card-balance">
                        ${selectedCard.balance} {selectedCard.currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-100 text-xs">Limit</p>
                      <p className="text-lg" data-testid="text-modal-card-limit">
                        ${selectedCard.spendingLimit}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Card Holder</label>
                    <p data-testid="text-modal-card-holder">{selectedCard.nameOnCard}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Expiry Date</label>
                    <p data-testid="text-modal-card-expiry">
                      {selectedCard.expiryDate || 'Not available'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Card ID</label>
                    <p className="font-mono text-sm" data-testid="text-modal-card-id">
                      {selectedCard.strowalletCardId || selectedCard.id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}