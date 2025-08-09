import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, CreditCardIcon, ClipboardDocumentListIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import CreateCardDialog from "@/components/cards/create-card-dialog";
import { Link } from "wouter";

export default function QuickActions() {
  const [showCreateCard, setShowCreateCard] = useState(false);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => setShowCreateCard(true)}
            className="bg-trust-blue text-white p-6 rounded-xl hover:bg-blue-700 transition duration-200 text-left h-auto flex-col items-start space-y-3"
          >
            <PlusIcon className="h-8 w-8" />
            <div>
              <div className="font-semibold">Create New Card</div>
              <div className="text-blue-200 text-sm">Virtual or Physical</div>
            </div>
          </Button>
          
          <Link href="/transactions">
            <Button
              variant="outline"
              className="w-full p-6 rounded-xl hover:border-trust-blue transition duration-200 text-left h-auto flex-col items-start space-y-3"
            >
              <ClipboardDocumentListIcon className="h-8 w-8 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-900">View Transactions</div>
                <div className="text-gray-500 text-sm">Recent Activity</div>
              </div>
            </Button>
          </Link>
          
          <Button
            variant="outline"
            className="p-6 rounded-xl hover:border-trust-blue transition duration-200 text-left h-auto flex-col items-start space-y-3"
          >
            <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <div>
              <div className="font-semibold text-gray-900">Generate Report</div>
              <div className="text-gray-500 text-sm">Analytics & Insights</div>
            </div>
          </Button>
          
          <Link href="/api">
            <Button
              variant="outline"
              className="w-full p-6 rounded-xl hover:border-trust-blue transition duration-200 text-left h-auto flex-col items-start space-y-3"
            >
              <Cog6ToothIcon className="h-8 w-8 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-900">API Settings</div>
                <div className="text-gray-500 text-sm">Keys & Configuration</div>
              </div>
            </Button>
          </Link>
        </div>
      </div>

      <CreateCardDialog open={showCreateCard} onOpenChange={setShowCreateCard} />
    </>
  );
}
