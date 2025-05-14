"use client";

import { DollarSign } from "lucide-react";
import dynamic from 'next/dynamic';
import { memo } from 'react';
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";

// Lazy load the enhanced components with optimized loading
const EnhancedStatusPanel = dynamic(
  () => import('@/components/EnhancedStatusPanelV2').then(mod => ({
    default: memo(mod.default)
  })),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-card animate-pulse rounded-xl"></div>
  }
);

const EnhancedKPICard = dynamic(
  () => import('@/components/EnhancedKPICard').then(mod => ({
    default: memo(mod.default)
  })),
  {
    ssr: false,
    loading: () => <div className="h-32 w-full bg-card animate-pulse rounded-xl"></div>
  }
);

const EnhancedWelcomeSection = dynamic(
  () => import('@/components/EnhancedWelcomeSection').then(mod => ({
    default: memo(mod.default)
  })),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-card animate-pulse rounded-xl"></div>
  }
);

const EnhancedAgentAction = dynamic(
  () => import('@/components/EnhancedAgentAction').then(mod => ({
    default: memo(mod.default)
  })),
  {
    ssr: false,
    loading: () => <div className="h-32 w-full bg-card animate-pulse rounded-xl"></div>
  }
);

// Sample data for the charts (kept for reference)
const revenueData = [
  { month: "Jan", amount: 4000 },
  { month: "Feb", amount: 3000 },
  { month: "Mar", amount: 5000 },
  { month: "Apr", amount: 7000 },
  { month: "May", amount: 6000 },
  { month: "Jun", amount: 8000 },
];

const expensesData = [
  { month: "Jan", amount: 2500 },
  { month: "Feb", amount: 2200 },
  { month: "Mar", amount: 3000 },
  { month: "Apr", amount: 3500 },
  { month: "May", amount: 3200 },
  { month: "Jun", amount: 3800 },
];

const profitData = revenueData.map((item, index) => ({
  month: item.month,
  amount: item.amount - expensesData[index].amount,
}));

// Note: This dashboard has been enhanced with MagicUI components
// See Memory Bank documentation: UI-Improvements.md for details

// Memoize the Dashboard component to prevent unnecessary re-renders
const Dashboard = memo(function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <AnimatedGradientText
          text="Dashboard"
          className="text-3xl font-bold"
          gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnhancedKPICard
          title="Revenue"
          value={8000}
          change={12}
          icon={DollarSign}
          color="blue"
        />
        <EnhancedKPICard
          title="Expenses"
          value={3800}
          change={-5}
          icon={DollarSign}
          color="red"
        />
        <EnhancedKPICard
          title="Profit"
          value={4200}
          change={18}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Status Panel and Welcome */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1">
          <EnhancedStatusPanel />
        </div>
        <div className="col-span-3">
          <EnhancedWelcomeSection />
        </div>
      </div>

      {/* Agent Actions */}
      <div className="mt-8 mb-4">
        <AnimatedGradientText
          text="Quick Actions"
          className="text-2xl font-semibold"
          gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #3b82f6)"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnhancedAgentAction />

        {/* Additional agent actions can be added here */}
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
