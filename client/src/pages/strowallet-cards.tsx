import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, Hash, User, Mail, RefreshCw, Eye, EyeOff, Copy } from "lucide-react";

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
  balance?: number;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  note?: string;
}

export default function StrowalletCards() {
  const [cards, setCards] = useState<StrowalletCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState<{[key: string]: boolean}>({});
  const [copiedField, setCopiedField] = useState<string>('');

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

  const toggleSensitive = (cardId: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
                    
                    {card.cardNumber && card.cardNumber !== "****" && (
                      <div className="mb-2">
                        <p className="text-xs opacity-80">CARD NUMBER</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">
                            {showSensitive[card.cardId] 
                              ? card.cardNumber.replace(/(.{4})/g, '$1 ').trim()
                              : `**** **** **** ${card.last4 || card.cardNumber.slice(-4)}`
                            }
                          </p>
                          <button
                            onClick={() => toggleSensitive(card.cardId)}
                            className="text-white/70 hover:text-white"
                          >
                            {showSensitive[card.cardId] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(card.cardNumber, `card-${card.cardId}`)}
                            className="text-white/70 hover:text-white"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          {copiedField === `card-${card.cardId}` && (
                            <span className="text-green-400 text-xs">Copied!</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-end">
                      <div>
                        {card.expiryMonth && card.expiryYear && card.expiryMonth !== "**" ? (
                          <div>
                            <p className="text-xs opacity-80">EXPIRES</p>
                            <p className="text-sm">{card.expiryMonth}/{card.expiryYear}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs opacity-80">CREATED</p>
                            <p className="text-sm">{card.createdDate}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-2xl font-bold opacity-50">VISA</div>
                        {card.cvv && card.cvv !== "***" && (
                          <div className="text-right mt-1">
                            <p className="text-xs opacity-80">CVV</p>
                            <div className="flex items-center gap-1">
                              <p className="font-mono text-sm">
                                {showSensitive[card.cardId] ? card.cvv : "***"}
                              </p>
                              <button
                                onClick={() => copyToClipboard(card.cvv, `cvv-${card.cardId}`)}
                                className="text-white/70 hover:text-white"
                              >
                                <Copy className="h-2 w-2" />
                              </button>
                              {copiedField === `cvv-${card.cardId}` && (
                                <span className="text-green-400 text-xs">✓</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
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

                {/* Complete Card Details Section */}
                <div className="mt-4 pt-4 border-t bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Complete Card Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-gray-500 text-xs">Full Card Number</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                          {showSensitive[card.cardId] 
                            ? card.cardNumber?.replace(/(.{4})/g, '$1 ').trim() || "****"
                            : `**** **** **** ${card.last4 || card.cardNumber?.slice(-4) || "****"}`
                          }
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSensitive(card.cardId)}
                          className="h-6 px-2"
                        >
                          {showSensitive[card.cardId] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(card.cardNumber || '', `full-card-${card.cardId}`)}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {copiedField === `full-card-${card.cardId}` && (
                          <span className="text-green-600 text-xs">Copied!</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-500 text-xs">CVV Code</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                          {showSensitive[card.cardId] ? card.cvv || "***" : "***"}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(card.cvv || '', `full-cvv-${card.cardId}`)}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {copiedField === `full-cvv-${card.cardId}` && (
                          <span className="text-green-600 text-xs">Copied!</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-500 text-xs">Expiry Date</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                          {card.expiryMonth && card.expiryYear 
                            ? `${card.expiryMonth}/${card.expiryYear}` 
                            : "**/**"
                          }
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`${card.expiryMonth}/${card.expiryYear}`, `expiry-${card.cardId}`)}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {copiedField === `expiry-${card.cardId}` && (
                          <span className="text-green-600 text-xs">Copied!</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-500 text-xs">Card Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(card.status)}>
                          {card.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Available Balance:</span> ${card.balance || 0}
                      </div>
                      <div>
                        <span className="font-medium">Card Type:</span> {card.cardBrand.toUpperCase()} Virtual
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {card.createdDate}
                      </div>
                      <div>
                        <span className="font-medium">Mode:</span> {card.mode}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}