import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, CreditCard, Banknote } from "lucide-react";

export default function Deposits() {
  const [selectedAmount, setSelectedAmount] = useState("");

  const { data: deposits = [] } = useQuery({
    queryKey: ["/api/deposits"],
  });

  const quickAmounts = ["50", "100", "250", "500", "1000"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="text-add-money">
          Add Money
        </h1>
      </div>

      {/* Quick Amount Selection */}
      <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Amount</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? "default" : "outline"}
                className={`h-16 text-lg font-semibold ${
                  selectedAmount === amount 
                    ? "bg-green-500 hover:bg-green-600 text-white" 
                    : "border-green-500 text-green-600 hover:bg-green-50"
                }`}
                onClick={() => setSelectedAmount(amount)}
                data-testid={`button-amount-${amount}`}
              >
                ${amount}
              </Button>
            ))}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-amount" className="text-sm font-medium text-gray-700">
                Or enter custom amount (USD)
              </Label>
              <Input
                id="custom-amount"
                type="number"
                placeholder="Enter amount..."
                value={selectedAmount}
                onChange={(e) => setSelectedAmount(e.target.value)}
                className="mt-1"
                data-testid="input-custom-amount"
              />
            </div>
            
            <Button 
              className="w-full h-12 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold"
              disabled={!selectedAmount || parseFloat(selectedAmount) <= 0}
              data-testid="button-proceed-payment"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Proceed to Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center border-green-500 text-green-600 hover:bg-green-50"
              data-testid="button-bank-transfer"
            >
              <Banknote className="h-8 w-8 mb-2" />
              <span>Bank Transfer</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center border-green-500 text-green-600 hover:bg-green-50"
              data-testid="button-credit-card"
            >
              <CreditCard className="h-8 w-8 mb-2" />
              <span>Credit/Debit Card</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center border-green-500 text-green-600 hover:bg-green-50"
              data-testid="button-mobile-money"
            >
              <DollarSign className="h-8 w-8 mb-2" />
              <span>Mobile Money</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Deposits */}
      <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Deposits</h2>
          </div>
          
          <div className="space-y-4">
            {deposits.map((deposit: any) => (
              <div 
                key={deposit.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                data-testid={`deposit-${deposit.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Deposit via {deposit.paymentMethod || 'Bank Transfer'}</p>
                    <p className="text-sm text-gray-500">{deposit.status === 'completed' ? 'Completed' : 'Pending'}</p>
                    <p className="text-xs text-green-600">● {deposit.status === 'completed' ? 'Success' : 'Processing'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${parseFloat(deposit.amount || '0').toFixed(2)} USD</p>
                  <p className="text-sm text-gray-500">{deposit.currency || 'USD'}</p>
                </div>
              </div>
            ))}
            
            {deposits.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No deposits yet</p>
                <p className="text-sm">Your deposit history will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}