import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard,
  CreditCard,
  DollarSign,
  Users,
  FileText,
  Settings,
  TrendingUp,
  Wallet,
  LogOut
} from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Cards', href: '/admin/cards', icon: CreditCard },
  { name: 'Add Money', href: '/admin/add-money', icon: DollarSign },
  { name: 'My Cards', href: '/admin/my-cards', icon: Wallet },
  { name: 'Transactions', href: '/admin/transactions', icon: TrendingUp },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'KYC Documents', href: '/admin/kyc', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const [location] = useLocation();
  const { admin, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">CardFlow Pro</h1>
            <p className="text-sm text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={`
                flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `} data-testid={`link-admin-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Admin User Info & Logout */}
      <div className="mt-auto space-y-4">
        <div className="p-4 bg-slate-800 rounded-lg">
          <div className="text-sm">
            <p className="text-slate-400">Logged in as</p>
            <p className="font-medium">{admin?.firstName} {admin?.lastName}</p>
            <p className="text-xs text-slate-500 mt-1">{admin?.role || 'Admin'}</p>
          </div>
        </div>
        
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full text-slate-300 border-slate-600 hover:bg-slate-800 hover:text-white"
          data-testid="button-admin-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}