import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, ArrowUpDown, TrendingUp } from "lucide-react";
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

  const totalBalance = cards.reduce((sum: number, card: any) => sum + parseFloat(card.balance || '0'), 0);
  const activeCards = cards.filter((card: any) => card.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-purple-900 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2" data-testid="text-welcome">
          Welcome Back, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-white/80" data-testid="text-subtitle">
          Manage your cards and transactions from one dashboard
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-balance">
                  ${totalBalance.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Add Money</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-deposits">
                  $1025
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Card</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-active-cards">
                  {activeCards}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/deposits">
          <Button 
            className="w-full h-16 bg-green-500 hover:bg-green-600 text-white rounded-xl text-lg font-semibold"
            data-testid="button-add-money"
          >
            <DollarSign className="h-6 w-6 mr-2" />
            Add Money
          </Button>
        </Link>
        
        <Link href="/cards">
          <Button 
            variant="outline" 
            className="w-full h-16 border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-xl text-lg font-semibold"
            data-testid="button-buy-card"
          >
            <CreditCard className="h-6 w-6 mr-2" />
            Buy Card
          </Button>
        </Link>
      </div>

      {/* Latest Transactions */}
      <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Latest Transactions</h2>
            <Link href="/transactions">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-green-600 border-green-500 hover:bg-green-50"
                data-testid="button-view-more-transactions"
              >
                View More
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {transactions.slice(0, 4).map((transaction: any) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ArrowUpDown className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.type === 'purchase' ? 'Virtual Card' : transaction.merchant}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.type === 'purchase' ? '(CARD FUND)' : `(${transaction.type.toUpperCase()})`}
                    </p>
                    <p className="text-xs text-green-600">● Success</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${Math.abs(parseFloat(transaction.amount)).toFixed(2)} USD</p>
                  <p className="text-sm text-gray-500">${(Math.abs(parseFloat(transaction.amount)) * 0.85).toFixed(2)} USD</p>
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
