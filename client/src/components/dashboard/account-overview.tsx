import { useQuery } from "@tanstack/react-query";
import { ApiKey } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AccountOverview() {
  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const apiUsage = 8432;
  const apiLimit = 10000;
  const usagePercentage = (apiUsage / apiLimit) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Account Status</div>
              <div className="text-sm text-gray-500">Verified & Active</div>
            </div>
            <Badge className="bg-green-100 text-green-800">Verified</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">API Status</div>
              <div className="text-sm text-gray-500">All systems operational</div>
            </div>
            <Badge className="bg-green-100 text-green-800">Online</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Security Score</div>
              <div className="text-sm text-gray-500">Strong security settings</div>
            </div>
            <div className="text-success-green font-semibold">95/100</div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">API Usage This Month</div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{apiUsage.toLocaleString()} requests</span>
              <span className="text-gray-500">/ {apiLimit.toLocaleString()} limit</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-trust-blue h-2 rounded-full transition-all duration-300" 
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
