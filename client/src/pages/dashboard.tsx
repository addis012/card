import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, Plus, ArrowRight, ChevronsUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch user data
  const { data: cards = [] } = useQuery({
    queryKey: ["/api/cards"],
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  // Get the first card for display
  const primaryCard = Array.isArray(cards) ? cards[0] : null;
  const totalBalance = Array.isArray(cards) ? cards.reduce((sum: number, card: any) => sum + parseFloat(card.balance || '0'), 0) : 0;
  const activeCards = Array.isArray(cards) ? cards.filter((card: any) => card.status === 'active').length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-blue-900 to-slate-900 text-white">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1" data-testid="text-welcome">
              Welcome Back, {user?.firstName} {user?.lastName}
            </h1>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5v-12z"/>
            </svg>
          </Button>
        </div>

        {/* Balance Cards Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Current Balance */}
          <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Current Balance</p>
                <p className="text-white text-xl font-semibold" data-testid="text-balance">
                  ${totalBalance.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Total Add Money */}
          <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Total Add Money</p>
                <p className="text-white text-xl font-semibold" data-testid="text-deposits">
                  $1025
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <ChevronsUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Active Card */}
          <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Active Card</p>
                <p className="text-white text-xl font-semibold" data-testid="text-active-cards">
                  {activeCards}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Link href="/deposits" className="flex-1">
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium" data-testid="button-add-money">
              Add Money
            </Button>
          </Link>
          <Link href="/cards" className="flex-1">
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium" data-testid="button-buy-card">
              Buy Card
            </Button>
          </Link>
        </div>

        {/* Virtual Card Section */}
        {primaryCard && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-semibold">Virtual Card</h2>
              <Link href="/cards">
                <Button variant="ghost" className="text-green-400 hover:text-green-300 text-sm">
                  + Create New Card
                </Button>
              </Link>
            </div>
            
            {/* Card Display */}
            <div className="relative bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl p-6 mb-4">
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
                <p className="text-white text-xl font-mono tracking-wider">
                  {primaryCard.maskedNumber || '**** **** **** ****'}
                </p>
                <div className="flex justify-between mt-2 text-xs text-white/70">
                  <span>exp: {primaryCard.expiryDate || "MM/YY"}</span>
                  <span>{primaryCard.cvv ? "***" : "***"}</span>
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
            <div className="text-center mb-6">
              <p className="text-white/70 text-sm mb-1">Card Balance</p>
              <p className="text-white text-2xl font-bold">{primaryCard.balance || '0.00'} {primaryCard.currency || 'USDT'}</p>
              
              {/* Action Icons */}
              <div className="flex justify-center space-x-8 mt-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white/70 text-xs">Details</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <ArrowRight className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white/70 text-xs">Remove Default</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white/70 text-xs">Fund</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                  </div>
                  <span className="text-white/70 text-xs">Transactions</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latest Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Latest Transactions</h2>
            <Link href="/transactions">
              <Button variant="ghost" className="text-green-400 hover:text-green-300 text-sm" data-testid="button-view-more-transactions">
                View More
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {Array.isArray(transactions) && transactions.slice(0, 5).map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4" data-testid={`transaction-${transaction.id}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.type === 'purchase' ? 'Virtual Card' : transaction.merchant}</p>
                    <p className="text-white/50 text-sm">
                      {transaction.type === 'purchase' ? '● Success' : `● ${transaction.status}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">${parseFloat(transaction.amount).toFixed(2)} USD</p>
                  <p className="text-white/50 text-sm">{parseFloat(transaction.amount).toFixed(2)} USD</p>
                </div>
              </div>
            ))}
            {(!Array.isArray(transactions) || transactions.length === 0) && (
              <div className="text-center py-8 text-white/50">
                <p>No transactions yet</p>
                <p className="text-sm">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}