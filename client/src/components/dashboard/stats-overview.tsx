import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  activeCards: number;
  monthlyVolume: number;
  transactions: number;
  uptime: number;
}

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-trust-blue">
              {stats ? formatNumber(stats.activeCards) : '0'}
            </div>
            <div className="text-gray-600 mt-1">Active Cards</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success-green">
              {stats ? formatCurrency(stats.monthlyVolume) : '$0'}
            </div>
            <div className="text-gray-600 mt-1">Monthly Volume</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {stats ? formatNumber(stats.transactions) : '0'}
            </div>
            <div className="text-gray-600 mt-1">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-trust-blue">
              {stats ? `${stats.uptime}%` : '0%'}
            </div>
            <div className="text-gray-600 mt-1">API Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
}
