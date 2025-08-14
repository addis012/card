import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, Hash, User, Mail, RefreshCw } from "lucide-react";

interface StrowalletCard {
  cardId: string;
  nameOnCard: string;
  cardType: string;
  cardBrand: string;
  status: string;
  customerId: string;
  createdDate: string;
  reference: string;
  cardUserId: string;
  amount: string;
  mode: string;
}

export default function StrowalletCards() {
  const [cards, setCards] = useState<StrowalletCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/strowallet-cards?' + new Date().getTime()); // Cache busting
      const data = await response.json();
      
      if (data.success) {
        setCards(data.cards);
        console.log('Updated card data:', data.cards);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Strowallet Cards
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your real cards created on the Strowallet platform
            </p>
          </div>
          <Button onClick={fetchCards} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Check Status
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No cards created yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create your first Strowallet card to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.cardId} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {card.cardBrand.toUpperCase()} Card
                  </CardTitle>
                  <Badge className={getStatusColor(card.status)}>
                    {card.status.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription>
                  Virtual {card.cardType} card in {card.mode} mode
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs opacity-80">CARD ID</p>
                        <p className="font-mono text-sm">{card.cardId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-80">AMOUNT</p>
                        <p className="font-bold text-lg">${card.amount}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs opacity-80">CARDHOLDER NAME</p>
                      <p className="font-semibold text-lg">{card.nameOnCard}</p>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs opacity-80">CREATED</p>
                        <p className="text-sm">{card.createdDate}</p>
                      </div>
                      <div className="text-2xl font-bold opacity-50">VISA</div>
                    </div>
                  </div>
                  
                  {/* Background pattern */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-white opacity-10"></div>
                  <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-20 w-20 rounded-full bg-white opacity-5"></div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Reference</p>
                      <p className="font-medium">{card.reference}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">User ID</p>
                      <p className="font-medium text-xs">{card.cardUserId}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Customer ID</p>
                      <p className="font-mono text-xs">{card.customerId}</p>
                    </div>
                  </div>
                  {card.note && (
                    <div className="mt-2 text-xs text-gray-500 italic">
                      {card.note}
                    </div>
                  )}
                  {card.balance !== undefined && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Balance: </span>
                      <span className="font-semibold text-green-600">${card.balance}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}