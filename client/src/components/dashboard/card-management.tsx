import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card as CardType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CardManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: cards, isLoading } = useQuery<CardType[]>({
    queryKey: ["/api/cards"],
  });

  const updateCardMutation = useMutation({
    mutationFn: (params: { id: string; updates: Partial<CardType> }) =>
      apiRequest("PATCH", `/api/cards/${params.id}`, params.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      toast({
        title: "Success",
        description: "Card updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update card",
        variant: "destructive",
      });
    },
  });

  const handleFreezeCard = (cardId: string) => {
    updateCardMutation.mutate({ id: cardId, updates: { status: 'frozen' } });
  };

  const handleUnfreezeCard = (cardId: string) => {
    updateCardMutation.mutate({ id: cardId, updates: { status: 'active' } });
  };

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Card Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Card Management</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
          </Button>
          <Button className="bg-trust-blue hover:bg-blue-700">+ Create Card</Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {cards?.map((card) => (
            <div key={card.id} className="border border-gray-200 rounded-lg p-4 hover:border-trust-blue transition duration-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <img 
                    src={card.type === 'virtual' 
                      ? "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80" 
                      : "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80"
                    }
                    alt={`${card.type} card`} 
                    className="w-16 h-10 rounded object-cover" 
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{card.name}</div>
                    <div className="text-sm text-gray-500">{card.maskedNumber}</div>
                  </div>
                </div>
                <Badge className={getStatusColor(card.status)}>
                  {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <div className="text-gray-500">Balance</div>
                  <div className="font-semibold">{formatCurrency(card.balance)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Limit</div>
                  <div className="font-semibold">{formatCurrency(card.limit)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Expires</div>
                  <div className="font-semibold">{String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="link" className="text-trust-blue p-0 h-auto">View Details</Button>
                {card.status === 'active' ? (
                  <Button 
                    variant="link" 
                    className="text-gray-500 p-0 h-auto"
                    onClick={() => handleFreezeCard(card.id)}
                    disabled={updateCardMutation.isPending}
                  >
                    Freeze
                  </Button>
                ) : (
                  <Button 
                    variant="link" 
                    className="text-success-green p-0 h-auto"
                    onClick={() => handleUnfreezeCard(card.id)}
                    disabled={updateCardMutation.isPending}
                  >
                    Unfreeze
                  </Button>
                )}
                <Button variant="link" className="text-gray-500 p-0 h-auto">Settings</Button>
              </div>
            </div>
          ))}
          
          {cards?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No cards found. Create your first card to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
