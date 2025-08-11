import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, TrendingUp, Plus } from "lucide-react";

interface DashboardStatsProps {
  totalBalance: string;
  activeCards: number;
  onAddMoney: () => void;
  onCreateCard: () => void;
}

export default function DashboardStats({ 
  totalBalance, 
  activeCards, 
  onAddMoney, 
  onCreateCard 
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Current Balance */}
      <Card className="bg-slate-800 text-white border-slate-700">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Current Balance</p>
              <p className="text-2xl font-bold">${totalBalance}</p>
            </div>
            <div className="p-2 bg-green-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <Button 
            onClick={onAddMoney}
            className="w-full mt-4 bg-green-600 hover:bg-green-700"
          >
            Add Money
          </Button>
        </CardContent>
      </Card>

      {/* Total Add Money */}
      <Card className="bg-slate-800 text-white border-slate-700">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Total Add Money</p>
              <p className="text-2xl font-bold">$1925</p>
            </div>
            <div className="p-2 bg-green-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <Button 
            onClick={onCreateCard}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Buy Card
          </Button>
        </CardContent>
      </Card>

      {/* Active Cards */}
      <Card className="bg-slate-800 text-white border-slate-700">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Active Cards</p>
              <p className="text-2xl font-bold">{activeCards}</p>
            </div>
            <div className="p-2 bg-blue-600 rounded-lg">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}