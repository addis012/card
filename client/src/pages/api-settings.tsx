import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiKey } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ApiSettings() {
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const updateApiKeyMutation = useMutation({
    mutationFn: (params: { id: string; updates: Partial<ApiKey> }) =>
      apiRequest("PATCH", `/api/api-keys/${params.id}`, params.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "Success",
        description: "API settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update API settings",
        variant: "destructive",
      });
    },
  });

  const apiKey = apiKeys?.[0];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const toggleTestMode = () => {
    if (apiKey) {
      updateApiKeyMutation.mutate({
        id: apiKey.id,
        updates: { isTestMode: !apiKey.isTestMode },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Configuration</h1>
          <p className="text-gray-600">Manage your API keys and integration settings</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Configuration</h1>
        <p className="text-gray-600">Manage your API keys and integration settings</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>API Configuration</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Manage your API keys and integration settings</p>
          </div>
          <Button 
            className="bg-trust-blue hover:bg-blue-700"
            onClick={() => toast({ title: "Info", description: "API key regeneration is not implemented in this demo" })}
          >
            Regenerate Keys
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="publicKey" className="text-sm font-medium text-gray-700">
                  Publishable Key
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="publicKey"
                    type="text"
                    value={apiKey?.publicKey || ''}
                    className="font-mono bg-gray-50 pr-10"
                    readOnly
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => apiKey && copyToClipboard(apiKey.publicKey)}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Safe to use in frontend applications</p>
              </div>
              
              <div>
                <Label htmlFor="secretKey" className="text-sm font-medium text-gray-700">
                  Secret Key
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="secretKey"
                    type={showSecretKey ? "text" : "password"}
                    value={apiKey?.secretKey || ''}
                    className="font-mono bg-gray-50 pr-10"
                    readOnly
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </Button>
                </div>
                <p className="text-xs text-error-red mt-1">⚠️ Keep secret! Use environment variables in production</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiEndpoint" className="text-sm font-medium text-gray-700">
                  API Endpoint
                </Label>
                <Input
                  id="apiEndpoint"
                  type="text"
                  value="https://api.cardflowpro.com/v1"
                  className="mt-2 font-mono bg-gray-50"
                  readOnly
                />
              </div>
              
              <div>
                <Label htmlFor="webhookUrl" className="text-sm font-medium text-gray-700">
                  Webhook URL
                </Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://your-domain.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-trust-blue">
                    {apiKey?.isTestMode ? 'Test Mode' : 'Live Mode'}
                  </div>
                  <div className="text-sm text-blue-600">
                    {apiKey?.isTestMode 
                      ? 'Safe for development and testing' 
                      : 'Live transactions will be processed'
                    }
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-blue-200 text-trust-blue hover:bg-blue-50"
                  onClick={toggleTestMode}
                  disabled={updateApiKeyMutation.isPending}
                >
                  {apiKey?.isTestMode ? 'Switch to Live' : 'Switch to Test'}
                </Button>
              </div>
            </div>
            
          </div>
          
          {/* Integration Example */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Integration Example</h4>
            <div className="bg-gray-900 rounded-lg p-4 text-sm overflow-x-auto">
              <pre className="text-gray-300">
                <code>{`// Initialize CardFlow Pro API
const cardFlow = new CardFlowPro({
  publishableKey: '${apiKey?.publicKey || 'pub_...'}'
});

// Create a new virtual card
const newCard = await cardFlow.cards.create({
  type: 'virtual',
  currency: 'USD',
  limit: 5000,
  name: 'Business Expenses'
});

// Handle webhook events
app.post('/webhook', (req, res) => {
  const event = cardFlow.webhooks.constructEvent(
    req.body,
    req.headers['cardflow-signature'],
    process.env.CARDFLOW_WEBHOOK_SECRET
  );
  
  if (event.type === 'card.transaction.created') {
    // Handle new transaction
    console.log('New transaction:', event.data.object);
  }
});`}</code>
              </pre>
            </div>
          </div>
          
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Environment Variables</h5>
              <p className="text-sm text-gray-600 mb-3">
                Always store your secret keys in environment variables, never hardcode them in your application.
              </p>
              <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                CARDFLOW_SECRET_KEY=sec_...
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Rate Limiting</h5>
              <p className="text-sm text-gray-600 mb-3">
                Our API implements rate limiting to ensure fair usage. Monitor your usage and implement exponential backoff.
              </p>
              <Badge variant="outline">10,000 requests/month included</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
