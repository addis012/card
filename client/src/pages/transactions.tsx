import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, ArrowLeft, Search } from "lucide-react";
import { Link } from "wouter";

export default function Transactions() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter transactions based on search term
  const filteredTransactions = Array.isArray(transactions) 
    ? transactions.filter((transaction: any) =>
        transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

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
            <h1 className="text-2xl font-bold text-white">
              Transaction Log
            </h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
          <Input
            placeholder="Ex: Tik Tok Ads Money"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700/50 border-slate-500 text-white placeholder:text-white/50 pl-10 h-12"
          />
        </div>

        {/* Pagination */}
        <div className="flex justify-center space-x-2">
          <Button variant="ghost" className="w-8 h-8 p-0 text-white hover:bg-white/10">
            1
          </Button>
          <Button className="w-8 h-8 p-0 bg-green-500 text-white">
            2
          </Button>
          <Button variant="ghost" className="w-8 h-8 p-0 text-white hover:bg-white/10">
            3
          </Button>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {/* Sample transactions matching the design */}
          <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Balance Update From Admin (USD)</p>
                <p className="text-white/50 text-sm">● Success</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">825.00 USD</p>
              <p className="text-white/50 text-sm">0.00 USD</p>
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
              <p className="text-white font-semibold">20.00 USD</p>
              <p className="text-white/50 text-sm">24.09 USD</p>
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
              <p className="text-white font-semibold">10.00 USD</p>
              <p className="text-white/50 text-sm">12.05 USD</p>
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
              <p className="text-white font-semibold">10.00 USD</p>
              <p className="text-white/50 text-sm">12.05 USD</p>
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
              <p className="text-white font-semibold">20.00 USD</p>
              <p className="text-white/50 text-sm">24.09 USD</p>
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
              <p className="text-white font-semibold">10.00 USD</p>
              <p className="text-white/50 text-sm">12.05 USD</p>
            </div>
          </div>

          {/* Display real transactions if available */}
          {filteredTransactions.map((transaction: any) => (
            <div key={transaction.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{transaction.merchant}</p>
                  <p className="text-white/50 text-sm">({transaction.type.toUpperCase()})</p>
                  <p className="text-white/50 text-sm">● {transaction.status}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">${parseFloat(transaction.amount).toFixed(2)} USD</p>
                <p className="text-white/50 text-sm">${(parseFloat(transaction.amount) * 1.18).toFixed(2)} USD</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Pagination */}
        <div className="flex justify-center space-x-2">
          <Button variant="ghost" className="w-8 h-8 p-0 text-white hover:bg-white/10">
            1
          </Button>
          <Button className="w-8 h-8 p-0 bg-green-500 text-white">
            2
          </Button>
          <Button variant="ghost" className="w-8 h-8 p-0 text-white hover:bg-white/10">
            →
          </Button>
        </div>
      </div>
    </div>
  );
}