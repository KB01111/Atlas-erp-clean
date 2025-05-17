"use client";

import { DollarSign } from "lucide-react";
import dynamic from 'next/dynamic';
import { memo } from 'react';
import { Typography } from "@/components/ui/typography";

// Lazy load the components with optimized loading
const StatusPanel = dynamic(
  () => import('@/components/dashboard/StatusPanel').then(mod => ({
    default: memo(mod.default)
  })),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-card animate-pulse rounded-xl"></div>
  }
);

const KPICard = dynamic(
  () => import('@/components/dashboard/KPICard').then(mod => ({
    default: memo(mod.default)
  })),
  {
    ssr: false,
    loading: () => <div className="h-32 w-full bg-card animate-pulse rounded-xl"></div>
  }
);

const WelcomeSection = dynamic(
  () => import('@/components/dashboard/WelcomeSection').then(mod => ({
    default: memo(mod.default)
  })),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-card animate-pulse rounded-xl"></div>
  }
);

const AgentAction = dynamic(
  () => import('@/components/dashboard/AgentAction').then(mod => ({
    default: memo(mod.default)
  })),
  {
    ssr: false,
    loading: () => <div className="h-32 w-full bg-card animate-pulse rounded-xl"></div>
  }
);

const RealTimeMetricsComponent = dynamic(
  () => import('@/components/dashboard/RealTimeMetrics').then(mod => ({
    default: memo(mod.default)
  })),
  {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-card animate-pulse rounded-xl"></div>
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
        <Typography.h1>Dashboard</Typography.h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Revenue"
          value={8000}
          change={12}
          icon={DollarSign}
          color="blue"
        />
        <KPICard
          title="Expenses"
          value={3800}
          change={-5}
          icon={DollarSign}
          color="red"
        />
        <KPICard
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
          <StatusPanel />
        </div>
        <div className="col-span-3">
          <WelcomeSection />
        </div>
      </div>

      {/* Real-Time Metrics */}
      <div className="mt-8 mb-4">
        <Typography.h2>Real-Time Metrics</Typography.h2>
      </div>
      <div className="mb-8">
        <RealTimeMetricsComponent />
      </div>

      {/* Agent Actions */}
      <div className="mt-8 mb-4">
        <Typography.h2>Quick Actions</Typography.h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AgentAction />

        {/* Additional agent actions can be added here */}
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
