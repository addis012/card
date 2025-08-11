import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card as CardType } from "@shared/schema";
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

  const { data: transactions = [] } = useQuery({
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
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{card.maskedNumber}</p>
                  </div>
                  <Badge className={getStatusColor(card.status)}>
                    {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="font-medium capitalize">{card.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Balance</span>
                    <span className="font-medium">{formatCurrency(card.balance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Limit</span>
                    <span className="font-medium">{formatCurrency(card.limit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Expires</span>
                    <span className="font-medium">
                      {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredCards.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No cards found</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm ? "No cards match your search criteria." : "Get started by creating your first card."}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowCreateCard(true)}
              className="mt-4 bg-trust-blue hover:bg-blue-700"
            >
              Create Your First Card
            </Button>
          )}
        </div>
      )}

      <CreateCardDialog open={showCreateCard} onOpenChange={setShowCreateCard} />
    </div>
  );
}
