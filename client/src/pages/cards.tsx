import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card as CardType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CreateCardDialog from "@/components/cards/create-card-dialog";

export default function Cards() {
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: cards, isLoading } = useQuery<CardType[]>({
    queryKey: ["/api/cards"],
  });

  const filteredCards = cards?.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.maskedNumber.includes(searchTerm)
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'frozen':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Card Management</h1>
        <p className="text-gray-600">Manage your virtual and physical cards</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          onClick={() => setShowCreateCard(true)}
          className="bg-trust-blue hover:bg-blue-700"
        >
          + Create New Card
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
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
