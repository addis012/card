import StatsOverview from "@/components/dashboard/stats-overview";
import QuickActions from "@/components/dashboard/quick-actions";
import CardManagement from "@/components/dashboard/card-management";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import AccountOverview from "@/components/dashboard/account-overview";

export default function Dashboard() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-trust-blue to-light-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Professional Card <span className="text-blue-200">Provider Services</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Secure, scalable card issuing and management platform. Create virtual and physical cards, manage transactions, and integrate with our comprehensive API.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-trust-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition duration-200">
                  Get Started
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-trust-blue transition duration-200">
                  View Documentation
                </button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Financial dashboard interface showing cards and analytics" 
                className="rounded-xl shadow-2xl w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <StatsOverview />

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuickActions />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CardManagement />
          </div>
          
          <div className="space-y-6">
            <RecentTransactions />
            <AccountOverview />
          </div>
        </div>
      </main>
    </div>
  );
}
