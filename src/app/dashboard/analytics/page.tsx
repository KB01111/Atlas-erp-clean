"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useCopilotReadable } from "@copilotkit/react-core";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ShineBorder } from "@/components/ui/shine-border";
import { NumberTicker } from "@/components/ui/number-ticker";

// Sample data for charts
const revenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
  { month: "Feb", revenue: 52000, expenses: 34000, profit: 18000 },
  { month: "Mar", revenue: 49000, expenses: 31000, profit: 18000 },
  { month: "Apr", revenue: 63000, expenses: 36000, profit: 27000 },
  { month: "May", revenue: 58000, expenses: 35000, profit: 23000 },
  { month: "Jun", revenue: 72000, expenses: 41000, profit: 31000 },
  { month: "Jul", revenue: 78000, expenses: 43000, profit: 35000 },
  { month: "Aug", revenue: 69000, expenses: 39000, profit: 30000 },
  { month: "Sep", revenue: 81000, expenses: 45000, profit: 36000 },
  { month: "Oct", revenue: 88000, expenses: 48000, profit: 40000 },
  { month: "Nov", revenue: 95000, expenses: 52000, profit: 43000 },
  { month: "Dec", revenue: 105000, expenses: 58000, profit: 47000 },
];

const customerData = [
  { month: "Jan", newCustomers: 120, activeCustomers: 1450, churnRate: 2.1 },
  { month: "Feb", newCustomers: 140, activeCustomers: 1580, churnRate: 1.9 },
  { month: "Mar", newCustomers: 135, activeCustomers: 1705, churnRate: 2.0 },
  { month: "Apr", newCustomers: 155, activeCustomers: 1850, churnRate: 1.8 },
  { month: "May", newCustomers: 165, activeCustomers: 2005, churnRate: 1.7 },
  { month: "Jun", newCustomers: 180, activeCustomers: 2175, churnRate: 1.6 },
  { month: "Jul", newCustomers: 195, activeCustomers: 2360, churnRate: 1.5 },
  { month: "Aug", newCustomers: 185, activeCustomers: 2535, churnRate: 1.6 },
  { month: "Sep", newCustomers: 210, activeCustomers: 2735, churnRate: 1.4 },
  { month: "Oct", newCustomers: 225, activeCustomers: 2950, churnRate: 1.3 },
  { month: "Nov", newCustomers: 240, activeCustomers: 3180, churnRate: 1.2 },
  { month: "Dec", newCustomers: 260, activeCustomers: 3430, churnRate: 1.1 },
];

const productData = [
  { name: "Product A", sales: 4500, growth: 15 },
  { name: "Product B", sales: 3800, growth: 8 },
  { name: "Product C", sales: 6200, growth: 22 },
  { name: "Product D", sales: 2900, growth: -5 },
  { name: "Product E", sales: 5100, growth: 17 },
];

export default function AnalyticsPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [averageGrowth, setAverageGrowth] = useState(0);

  // Calculate summary metrics
  useEffect(() => {
    // Calculate total revenue and profit
    const revTotal = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const profitTotal = revenueData.reduce((sum, item) => sum + item.profit, 0);
    
    // Get latest customer count
    const customers = customerData[customerData.length - 1].activeCustomers;
    
    // Calculate average product growth
    const avgGrowth = productData.reduce((sum, item) => sum + item.growth, 0) / productData.length;
    
    setTotalRevenue(revTotal);
    setTotalProfit(profitTotal);
    setTotalCustomers(customers);
    setAverageGrowth(avgGrowth);
  }, []);

  // Make analytics data readable by CopilotKit
  useCopilotReadable({
    name: "financial_analytics",
    description: "Financial analytics data including revenue, expenses, and profit",
    value: revenueData,
  });

  useCopilotReadable({
    name: "customer_analytics",
    description: "Customer analytics data including new customers, active customers, and churn rate",
    value: customerData,
  });

  useCopilotReadable({
    name: "product_analytics",
    description: "Product analytics data including sales and growth",
    value: productData,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Total Revenue" 
          value={totalRevenue} 
          prefix="$" 
          change={12.5} 
          gradient="linear-gradient(to right, #3b82f6, #2563eb)"
        />
        <SummaryCard 
          title="Total Profit" 
          value={totalProfit} 
          prefix="$" 
          change={18.3} 
          gradient="linear-gradient(to right, #10b981, #059669)"
        />
        <SummaryCard 
          title="Active Customers" 
          value={totalCustomers} 
          change={9.7} 
          gradient="linear-gradient(to right, #8b5cf6, #7c3aed)"
        />
        <SummaryCard 
          title="Avg. Product Growth" 
          value={averageGrowth} 
          suffix="%" 
          change={2.1} 
          gradient="linear-gradient(to right, #f59e0b, #d97706)"
        />
      </div>

      {/* Revenue Chart */}
      <ShineBorder
        borderColor="rgba(59, 130, 246, 0.2)"
        shineBorderColor="rgba(59, 130, 246, 0.6)"
        borderRadius="0.75rem"
        className="p-0.5"
      >
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Revenue & Profit</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="expenses" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                <Area type="monotone" dataKey="profit" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ShineBorder>

      {/* Customer Growth and Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShineBorder
          borderColor="rgba(139, 92, 246, 0.2)"
          shineBorderColor="rgba(139, 92, 246, 0.6)"
          borderRadius="0.75rem"
          className="p-0.5"
        >
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Customer Growth</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="newCustomers" stroke="#8b5cf6" activeDot={{ r: 8 }} />
                  <Line yAxisId="left" type="monotone" dataKey="activeCustomers" stroke="#3b82f6" />
                  <Line yAxisId="right" type="monotone" dataKey="churnRate" stroke="#ef4444" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ShineBorder>

        <ShineBorder
          borderColor="rgba(245, 158, 11, 0.2)"
          shineBorderColor="rgba(245, 158, 11, 0.6)"
          borderRadius="0.75rem"
          className="p-0.5"
        >
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Product Performance</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="#f59e0b" />
                  <Bar yAxisId="right" dataKey="growth" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ShineBorder>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ 
  title, 
  value, 
  prefix = "", 
  suffix = "", 
  change, 
  gradient 
}: { 
  title: string; 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  change: number; 
  gradient: string; 
}) {
  return (
    <ShineBorder
      borderColor="rgba(209, 213, 219, 0.2)"
      shineBorderColor="rgba(209, 213, 219, 0.6)"
      borderRadius="0.75rem"
      className="p-0.5"
    >
      <div className="bg-white p-6 rounded-xl shadow-sm h-full">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="mt-2 flex items-baseline">
          <AnimatedGradientText
            text={`${prefix}${Math.round(value).toLocaleString()}${suffix}`}
            className="text-2xl font-bold"
            gradient={gradient}
          />
        </div>
        <div className={`mt-2 flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <span className="font-medium">
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
          <span className="ml-2 text-gray-500">vs last period</span>
        </div>
      </div>
    </ShineBorder>
  );
}
