import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card as CardType, Transaction } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Plus, CreditCard, ArrowUpDown, Pause, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function Cards() {
  const [showCardDetails, setShowCardDetails] = useState(false);

  const { data: cards, isLoading } = useQuery<CardType[]>({
    queryKey: ["/api/cards"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const primaryCard = cards?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="text-virtual-card">
          Virtual Card →
        </h1>
        <Button 
          className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-6"
          data-testid="button-create-new-card"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create a New Card
        </Button>
      </div>

      {/* Virtual Card Display */}
      {primaryCard ? (
        <div className="relative">
          {/* Card */}
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-6 text-white shadow-2xl max-w-md mx-auto"
               data-testid="card-display">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="text-sm text-gray-300">ZEMACARD BUY VIRTUAL CARDS IN ETHIOPIA</div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>

            {/* Card Number */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-400 w-12 h-8 rounded-md flex items-center justify-center text-black font-bold text-sm">
                  5561
                </div>
                <div className="text-xl font-mono tracking-wider">
                  {showCardDetails ? primaryCard.cardNumber || "5061 **** **** 3966" : "50** **** **** **66"}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCardDetails(!showCardDetails)}
                  className="text-white hover:bg-white/10"
                  data-testid="button-toggle-card-details"
                >
                  {showCardDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Card Details */}
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-gray-400 mb-1">VALID THRU / 10 / 27</div>
                <div className="font-semibold text-lg">
                  {primaryCard.nameOnCard || "ADDISU AEMASU"}
                </div>
              </div>
              <div className="w-12 h-8">
                {/* Mastercard logo placeholder */}
                <div className="bg-red-500 w-6 h-6 rounded-full inline-block"></div>
                <div className="bg-yellow-400 w-6 h-6 rounded-full inline-block -ml-3"></div>
              </div>
            </div>
          </div>

          {/* Card Balance */}
          <div className="text-center mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Card Balance</h2>
            <p className="text-3xl font-bold text-gray-900" data-testid="text-card-balance">
              ${parseFloat(primaryCard.balance || '0').toFixed(2)} USD
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto border-green-500 text-green-600 hover:bg-green-50"
              data-testid="button-details"
            >
              <CreditCard className="h-6 w-6 mb-2" />
              <span className="text-sm">Details</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto border-green-500 text-green-600 hover:bg-green-50"
              data-testid="button-remove-default"
            >
              <Pause className="h-6 w-6 mb-2" />
              <span className="text-sm">Remove Default</span>
            </Button>
            <Link href="/deposits">
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-4 h-auto border-green-500 text-green-600 hover:bg-green-50 w-full"
                data-testid="button-fund"
              >
                <DollarSign className="h-6 w-6 mb-2" />
                <span className="text-sm">Fund</span>
              </Button>
            </Link>
            <Link href="/transactions">
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-4 h-auto border-green-500 text-green-600 hover:bg-green-50 w-full"
                data-testid="button-transactions"
              >
                <ArrowUpDown className="h-6 w-6 mb-2" />
                <span className="text-sm">Transactions</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cards Yet</h3>
          <p className="text-gray-600 mb-6">Create your first virtual card to get started</p>
          <Button className="bg-green-500 hover:bg-green-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Card
          </Button>
        </div>
      )}

      {/* Recent Transactions */}
      <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Transaction</h2>
            <Link href="/transactions">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-green-600 border-green-500 hover:bg-green-50"
                data-testid="button-view-more"
              >
                View More
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction: any) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Virtual Card</p>
                    <p className="text-sm text-gray-500">(CARD FUND)</p>
                    <p className="text-xs text-green-600">● Success</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${Math.abs(parseFloat(transaction.amount || '0')).toFixed(2)} USD</p>
                  <p className="text-sm text-gray-500">${(Math.abs(parseFloat(transaction.amount || '0')) * 0.85).toFixed(2)} USD</p>
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No transactions yet</p>
                <p className="text-sm">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
