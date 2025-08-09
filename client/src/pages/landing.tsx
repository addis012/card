import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, CreditCard, Shield, Zap, BarChart3, Users, Globe, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: CreditCard,
      title: "Card Issuing",
      description: "Create virtual and physical cards instantly with full customization"
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Bank-level security with fraud protection and real-time monitoring"
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Real-time transaction processing and immediate card activation"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive reporting and analytics for all your card operations"
    },
    {
      icon: Users,
      title: "User Management",
      description: "Advanced KYC workflows and user verification systems"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Multi-currency support with worldwide acceptance"
    }
  ];

  const benefits = [
    "Instant card provisioning",
    "Real-time transaction monitoring",
    "Comprehensive API integration",
    "Advanced fraud protection",
    "Multi-currency support",
    "24/7 customer support"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm4.64-1.96l3.54 3.54 7.07-7.07 1.41 1.41-8.48 8.48-4.95-4.95 1.41-1.41z"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-900">CardFlow Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Professional Card Provider Services
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Secure, scalable card issuing and management platform. Create virtual and physical cards, manage transactions, and integrate with our comprehensive API.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-4">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4">
                    Sign In
                  </Button>
                </Link>
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

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need for card management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides all the tools and features you need to issue, manage, and monitor cards at scale.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Why choose CardFlow Pro?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of businesses that trust our platform for their card issuing needs.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Team working with financial technology" 
                className="rounded-xl shadow-2xl w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our platform today and start issuing cards in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-4">
                Create Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm4.64-1.96l3.54 3.54 7.07-7.07 1.41 1.41-8.48 8.48-4.95-4.95 1.41-1.41z"/>
              </svg>
              <span className="ml-2 text-xl font-bold">CardFlow Pro</span>
            </div>
            <p className="text-gray-400">
              © 2025 CardFlow Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}