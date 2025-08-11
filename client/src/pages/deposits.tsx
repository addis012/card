import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Deposit } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, ArrowLeft, Check } from "lucide-react";
import { Link } from "wouter";

export default function Deposits() {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState("");
  const [paymentGateway, setPaymentGateway] = useState("Commercial Bank CBE Birr");
  const [showPreview, setShowPreview] = useState(false);

  const { data: deposits = [] } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits"],
  });

  const quickAmounts = ["50", "100", "250", "500", "1000"];
  
  const exchangeRate = 150.0000; // 1 USD = 150 Birr
  const fees = 0.0000;
  const birAmount = parseFloat(selectedAmount) * exchangeRate || 0;

  const handleConfirm = () => {
    // Handle the deposit confirmation logic here
    console.log("Deposit confirmed:", {
      amount: selectedAmount,
      gateway: paymentGateway,
      birAmount,
      fees
    });
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
            <h1 className="text-2xl font-bold text-white" data-testid="text-add-money">
              Add Money
            </h1>
          </div>
        </div>

        {!showPreview ? (
          <>
            {/* Payment Gateway Selection */}
            <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4">Payment Gateway</h2>
              <Select value={paymentGateway} onValueChange={setPaymentGateway}>
                <SelectTrigger className="w-full bg-slate-600/50 border-slate-500 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Commercial Bank CBE Birr">Commercial Bank CBE Birr</SelectItem>
                  <SelectItem value="Dashen Bank">Dashen Bank</SelectItem>
                  <SelectItem value="Bank of Abyssinia">Bank of Abyssinia</SelectItem>
                  <SelectItem value="Awash Bank">Awash Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4">Enter Amount</h2>
              <div className="space-y-4">
                <div>
                  <Input
                    type="number"
                    placeholder="Enter Amount"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    className="w-full bg-slate-600/50 border-slate-500 text-white placeholder:text-white/50 h-12 text-lg"
                    data-testid="input-amount"
                  />
                  <div className="flex justify-between mt-2 text-sm text-white/70">
                    <span>Limit 10,000.00 USD - 1,000,000.00 USD</span>
                    <span>Charge: 0.0000 Birr %</span>
                  </div>
                  <div className="text-right mt-1 text-sm text-white/70">
                    0.00000
                  </div>
                </div>

                <Button 
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium h-12"
                  disabled={!selectedAmount || parseFloat(selectedAmount) <= 0}
                  onClick={() => setShowPreview(true)}
                  data-testid="button-confirm"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Add Money Preview */
          <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-6">
            <h2 className="text-white text-lg font-semibold mb-6">Add Money Preview</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-white/70">Enter Amount</span>
                <span className="text-white font-semibold">{selectedAmount} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Exchange Rate</span>
                <span className="text-white">{selectedAmount} USD = {birAmount.toFixed(4)} Birr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Fees & Charges</span>
                <span className="text-white">{fees.toFixed(4)} Birr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Conversion Amount</span>
                <span className="text-white">{fees.toFixed(4)} Birr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Will Get</span>
                <span className="text-white font-semibold">{fees.toFixed(4)} USD</span>
              </div>
              <div className="flex justify-between border-t border-slate-600 pt-4">
                <span className="text-white/70">Total Payable Amount</span>
                <span className="text-white font-bold">{fees.toFixed(4)} Birr</span>
              </div>
            </div>

            <Button 
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium h-12 mt-6"
              onClick={handleConfirm}
              data-testid="button-confirm-payment"
            >
              Confirm
            </Button>
          </div>
        )}

        {/* Add Money Log */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Add Money Log</h2>
            <Button variant="ghost" className="text-green-400 hover:text-green-300 text-sm">
              View More
            </Button>
          </div>
          
          <div className="space-y-3">
            {deposits.slice(0, 3).map((deposit: any) => (
              <div key={deposit.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Add Balance via Tele Birr</p>
                    <p className="text-white/50 text-sm">● Success</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">1,500,000.00 USD</p>
                  <p className="text-white/50 text-sm">225,000.0000 Birr</p>
                </div>
              </div>
            ))}
            
            {/* Sample transactions if no real data */}
            {deposits.length === 0 && (
              <>
                <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Add Balance via Tele Birr</p>
                      <p className="text-white/50 text-sm">● Success</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">10,000.00 USD</p>
                    <p className="text-white/50 text-sm">1,500,000 Birr</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Add Balance via Tele Birr</p>
                      <p className="text-white/50 text-sm">● Success</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">15,000.00 USD</p>
                    <p className="text-white/50 text-sm">2,250,000 Birr</p>
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