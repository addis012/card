import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="text-transaction-log">
          Transaction Log
        </h1>
        <div className="flex items-center space-x-2">
          <Input 
            placeholder="Ex TxN ID, Add Money"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-white/50"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Transaction List */}
      <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            {transactions?.map((transaction: any) => (
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
                    <p className="font-medium text-gray-900">
                      {transaction.type === 'deposit' ? 'Balance Update From Admin (USD)' : 'Virtual Card'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.type === 'deposit' ? 'Balance Top-up' : '(CARD FUND)'}
                    </p>
                    <p className="text-xs text-green-600">● Success</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">
                    ${Math.abs(parseFloat(transaction.amount || '0')).toFixed(2)} USD
                  </p>
                  <p className="text-sm text-gray-500">
                    ${(Math.abs(parseFloat(transaction.amount || '0')) * 0.85).toFixed(2)} USD
                  </p>
                </div>
              </div>
            ))}
            
            {(!transactions || transactions.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
                <p className="text-gray-600">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}