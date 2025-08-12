import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card as CardType, Transaction } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Plus, CreditCard, ArrowUpDown, ArrowLeft, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Cards() {
  const { user } = useAuth();
  const [showCardDetails, setShowCardDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cards, isLoading } = useQuery<CardType[]>({
    queryKey: ["/api/cards"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const primaryCard = Array.isArray(cards) ? cards[0] : null;

  // Get real card transactions from Strowallet
  const { data: cardTransactions = [] } = useQuery({
    queryKey: ["/api/cards", primaryCard?.id, "strowallet-transactions"],
    enabled: !!primaryCard?.id,
  });

  // Block/Unblock card mutation
  const blockCardMutation = useMutation({
    mutationFn: async (blocked: boolean) => {
      if (!primaryCard?.id) throw new Error("No card selected");
      const response = await fetch(`/api/cards/${primaryCard.id}/block`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked }),
      });
      if (!response.ok) throw new Error("Failed to update card status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      toast({
        title: primaryCard?.status === 'frozen' ? "Card Unblocked" : "Card Blocked",
        description: primaryCard?.status === 'frozen' ? "Your card is now active" : "Your card has been blocked for security",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update card status",
        variant: "destructive",
      });
    },
  });

  // Fund card mutation
  const fundCardMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!primaryCard?.id) throw new Error("No card selected");
      const response = await fetch(`/api/cards/${primaryCard.id}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency: "USD" }),
      });
      if (!response.ok) throw new Error("Failed to fund card");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      toast({
        title: "Card Funded",
        description: "Your card has been successfully funded",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fund card",
        variant: "destructive",
      });
    },
  });

  const handleBlockCard = () => {
    const isCurrentlyBlocked = primaryCard?.status === 'frozen';
    blockCardMutation.mutate(!isCurrentlyBlocked);
  };

  const handleFundCard = () => {
    const amount = prompt("Enter amount to fund (USD):");
    if (amount && !isNaN(parseFloat(amount))) {
      fundCardMutation.mutate(parseFloat(amount));
    }
  };

  const handleViewTransactions = () => {
    // Navigate to transactions page for this specific card
    window.location.href = `/transactions?cardId=${primaryCard?.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-blue-900 to-slate-900 text-white">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white" data-testid="text-virtual-card">
              Virtual Card →
            </h1>
          </div>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-2"
            data-testid="button-create-new-card"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Card
          </Button>
        </div>

        {/* Virtual Card Display */}
        {primaryCard && (
          <div className="space-y-6">
            {/* Card Display */}
            <div className="relative bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl p-6 mx-auto max-w-md">
              {/* Card Brand Logo */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-white text-sm font-medium">ZEMACARD BUY VIRTUAL CARDS IN ETHIOPIA</span>
                <div className="w-8 h-8">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <circle cx="24" cy="24" r="24" fill="#ff5f00"/>
                    <circle cx="16" cy="24" r="16" fill="#eb001b"/>
                    <circle cx="32" cy="24" r="16" fill="#f79e1b"/>
                  </svg>
                </div>
              </div>

              {/* Card Number */}
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-400 w-12 h-8 rounded-md flex items-center justify-center text-black font-bold text-sm">
                    {primaryCard.cardNumber ? primaryCard.cardNumber.slice(0, 4) : "****"}
                  </div>
                  <p className="text-white text-xl font-mono tracking-wider">
                    {showCardDetails ? (primaryCard.cardNumber || primaryCard.maskedNumber || "**** **** **** ****") : (primaryCard.maskedNumber || "**** **** **** ****")}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCardDetails(!showCardDetails)}
                    className="text-white hover:bg-white/10 p-1"
                    data-testid="button-toggle-card-details"
                  >
                    {showCardDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex justify-between mt-2 text-xs text-white/70">
                  <span>exp: {primaryCard.expiryDate || "MM/YY"}</span>
                  <span>{showCardDetails ? (primaryCard.cvv || "***") : "***"}</span>
                </div>
              </div>

              {/* Card Holder */}
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wide">
                  {primaryCard.nameOnCard || `${user?.firstName} ${user?.lastName}`}
                </p>
              </div>

              {/* WiFi Icon */}
              <div className="absolute top-6 right-16">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
                </svg>
              </div>
            </div>

            {/* Card Balance */}
            <div className="text-center">
              <p className="text-white/70 text-sm mb-1">Card Balance</p>
              <p className="text-white text-2xl font-bold">{primaryCard.balance || '0.00'} {primaryCard.currency || 'USDT'}</p>
              
              {/* Action Icons */}
              <div className="flex justify-center space-x-6 mt-4">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center p-2"
                  onClick={() => setShowCardDetails(!showCardDetails)}
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white/70 text-xs">Details</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center p-2"
                  onClick={() => handleBlockCard()}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    primaryCard.status === 'frozen' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    {primaryCard.status === 'frozen' ? (
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-white/70 text-xs">{primaryCard.status === 'frozen' ? 'Unblock' : 'Block'}</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center p-2"
                  onClick={() => handleFundCard()}
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white/70 text-xs">Fund</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center p-2"
                  onClick={() => handleViewTransactions()}
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <ArrowUpDown className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white/70 text-xs">Transactions</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Recent Transaction</h2>
            <Link href="/transactions">
              <Button variant="ghost" className="text-green-400 hover:text-green-300 text-sm">
                View More
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {Array.isArray((cardTransactions as any)?.transactions) && (cardTransactions as any).transactions.slice(0, 5).map((transaction: any) => (
              <div key={transaction.transaction_id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4" data-testid={`transaction-${transaction.transaction_id}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.transaction_type === 'credit' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.merchant_name || transaction.description}</p>
                    <p className="text-white/50 text-sm">{transaction.merchant_category || transaction.transaction_type.toUpperCase()}</p>
                    <p className="text-white/50 text-sm">● {transaction.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${transaction.transaction_type === 'credit' ? 'text-green-400' : 'text-white'}`}>
                    {transaction.transaction_type === 'credit' ? '+' : ''}{Math.abs(parseFloat(transaction.amount)).toFixed(2)} {transaction.currency}
                  </p>
                  <p className="text-white/50 text-sm">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Fallback to regular transactions if no Strowallet transactions */}
            {(!(cardTransactions as any)?.transactions || (cardTransactions as any).transactions.length === 0) && Array.isArray(transactions) && transactions.slice(0, 5).map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4" data-testid={`transaction-${transaction.id}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Virtual Card</p>
                    <p className="text-white/50 text-sm">(CARD FUND)</p>
                    <p className="text-white/50 text-sm">● Success</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{Math.abs(parseFloat(transaction.amount)).toFixed(2)} USD</p>
                  <p className="text-white/50 text-sm">{(Math.abs(parseFloat(transaction.amount)) * 118.09).toFixed(2)} USD</p>
                </div>
              </div>
            ))}
            
            {/* Sample transactions if no real data */}
            {(!Array.isArray(transactions) || transactions.length === 0) && (
              <>
                <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Virtual Card</p>
                      <p className="text-white/50 text-sm">(CARD FUND)</p>
                      <p className="text-white/50 text-sm">● Success</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">100.00 USD</p>
                    <p className="text-white/50 text-sm">118.09 USD</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Virtual Card</p>
                      <p className="text-white/50 text-sm">(CARD FUND)</p>
                      <p className="text-white/50 text-sm">● Success</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">200.00 USD</p>
                    <p className="text-white/50 text-sm">232.00 USD</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Virtual Card</p>
                      <p className="text-white/50 text-sm">(CARD FUND)</p>
                      <p className="text-white/50 text-sm">● Success</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">50.00 USD</p>
                    <p className="text-white/50 text-sm">57.05 USD</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}