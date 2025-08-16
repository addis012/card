import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowUpDown, 
  DollarSign, 
  Settings, 
  UserCircle, 
  LogOut,
  Bell,
  Users
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/cards", icon: CreditCard, label: "My Card" },
    { path: "/strowallet-cards", icon: CreditCard, label: "Strowallet Cards" },
    { path: "/customers", icon: Users, label: "Customers" },
    { path: "/admin-customers", icon: Users, label: "Admin Customers" },
    { path: "/deposits", icon: DollarSign, label: "Add Money" },
    { path: "/transactions", icon: ArrowUpDown, label: "Transactions" },
    { path: "/profile", icon: UserCircle, label: "My Profile" },
    { path: "/api", icon: Settings, label: "KYC Verification" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-slate-800 via-blue-900 to-slate-900 
        text-white z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 border-2 border-white/20">
                <AvatarImage src="/placeholder-avatar.png" alt={user?.firstName} />
                <AvatarFallback className="bg-white/10 text-white font-semibold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm text-white/70">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/70 hover:text-white hover:bg-white/10"
                data-testid="button-notifications"
              >
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link href={item.path}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-all ${
                        isActive(item.path) 
                          ? 'bg-white/20 text-white border-r-2 border-green-400' 
                          : ''
                      }`}
                      onClick={onClose}
                      data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Profile & Logout */}
          <div className="p-4 border-t border-white/10">
            <Link href="/profile">
              <Button 
                variant="ghost" 
                className="w-full justify-start px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 mb-2"
                onClick={onClose}
                data-testid="link-profile"
              >
                <UserCircle className="h-5 w-5 mr-3" />
                My Profile
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={() => { logout(); onClose(); }}
              className="w-full justify-start px-4 py-3 text-white/70 hover:text-white hover:bg-red-500/20"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}