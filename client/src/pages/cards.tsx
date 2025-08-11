import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card as CardType, Transaction } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Plus, CreditCard, ArrowUpDown, ArrowLeft, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function Cards() {
  const { user } = useAuth();
  const [showCardDetails, setShowCardDetails] = useState(false);

  const { data: cards, isLoading } = useQuery<CardType[]>({
    queryKey: ["/api/cards"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const primaryCard = Array.isArray(cards) ? cards[0] : null;

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
                    5561
                  </div>
                  <p className="text-white text-xl font-mono tracking-wider">
                    {showCardDetails ? (primaryCard.maskedNumber || "**** **** **** 3966") : "50** **** ****"}
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
                  <span>exp: 10 / 27</span>
                  <span>50***</span>
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
              <p className="text-white text-2xl font-bold">0 USD</p>
              
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
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
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
                    <ArrowUpDown className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white/70 text-xs">Transactions</span>
                </div>
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
            {Array.isArray(transactions) && transactions.slice(0, 5).map((transaction: any) => (
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