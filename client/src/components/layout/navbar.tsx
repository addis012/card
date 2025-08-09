import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/cards", label: "Cards" },
    { href: "/transactions", label: "Transactions" },
    { href: "/api", label: "API" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === href;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <svg className="h-8 w-8 text-trust-blue" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm4.64-1.96l3.54 3.54 7.07-7.07 1.41 1.41-8.48 8.48-4.95-4.95 1.41-1.41z"/>
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-900">CardFlow Pro</span>
              </div>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className={
                        isActive(item.href)
                          ? "bg-trust-blue text-white hover:bg-trust-blue/90"
                          : "text-gray-600 hover:text-gray-900"
                      }
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5V7a12 12 0 1 1 24 0v10z"/>
              </svg>
            </Button>
            <Avatar>
              <AvatarFallback className="bg-trust-blue text-white">JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
}
