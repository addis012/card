import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-gradient-to-r from-indigo-900 via-blue-900 to-purple-900 text-white p-4">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onMenuClick}
          className="text-white hover:bg-white/10"
          data-testid="button-menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <h1 className="text-lg font-semibold">CardFlow Pro</h1>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            data-testid="button-search"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            data-testid="button-notifications-mobile"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}