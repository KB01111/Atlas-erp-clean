"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { BorderContainer } from "@/components/ui/shine-border";
import { NumberDisplay } from "@/components/ui/number-display";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedActionButton } from "@/components/ui/enhanced-action-button";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import {
  BarChart3, LineChart as LineChartIcon, PieChart, ArrowUpRight, ArrowDownRight,
  Download, Calendar, Filter, RefreshCw, Settings, Info, HelpCircle,
  DollarSign, Users, TrendingUp, Package
} from "lucide-react";
import { useRateLimit } from "@/context/RateLimitContext";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [showExport, setShowExport] = useState(false);
  const { throttle } = useRateLimit();

  // Function to fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, you would fetch this data from an API
      // For now, we'll simulate a delay and use the static data
      await throttle('analytics-refresh', async () => {
        await new Promise(resolve => setTimeout(resolve, 800));

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
      }, 5000);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to fetch analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [throttle]);

  // Fetch data on component mount
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Make analytics data readable by CopilotKit
  useCopilotReadable({
    name: "financial_analytics",
    description: "Financial analytics data including revenue, expenses, and profit",
    value: {
      data: revenueData,
      summary: {
        totalRevenue,
        totalProfit,
        timeRange,
      }
    },
  });

  useCopilotReadable({
    name: "customer_analytics",
    description: "Customer analytics data including new customers, active customers, and churn rate",
    value: {
      data: customerData,
      summary: {
        totalCustomers,
        timeRange,
      }
    },
  });

  useCopilotReadable({
    name: "product_analytics",
    description: "Product analytics data including sales and growth",
    value: {
      data: productData,
      summary: {
        averageGrowth,
        timeRange,
      }
    },
  });

  // Export analytics data as CSV
  const exportAnalyticsData = useCallback(() => {
    try {
      // Create CSV content
      const csvContent = [
        // Headers
        ['Month', 'Revenue', 'Expenses', 'Profit', 'New Customers', 'Active Customers', 'Churn Rate'].join(','),
        // Data rows
        ...revenueData.map((item, index) => [
          item.month,
          item.revenue,
          item.expenses,
          item.profit,
          customerData[index]?.newCustomers || '',
          customerData[index]?.activeCustomers || '',
          customerData[index]?.churnRate || '',
        ].join(','))
      ].join('\n');

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data');
    }
  }, []);

  // Register the export action with CopilotKit
  useCopilotAction({
    name: "export_analytics_data",
    description: "Export analytics data as CSV",
    parameters: [],
    handler: async () => {
      exportAnalyticsData();
      return "Analytics data exported successfully";
    },
  });

  return (
    <div className="space-y-6">
      {/* Header with title, time range selector, and actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Financial and business performance metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center bg-muted rounded-md p-1 mr-2">
            <button
              onClick={() => setTimeRange('day')}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'day' ? 'bg-card shadow-sm' : ''}`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'week' ? 'bg-card shadow-sm' : ''}`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'month' ? 'bg-card shadow-sm' : ''}`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange('quarter')}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'quarter' ? 'bg-card shadow-sm' : ''}`}
            >
              Quarter
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'year' ? 'bg-card shadow-sm' : ''}`}
            >
              Year
            </button>
          </div>

          {/* Export button */}
          <EnhancedButton
            variant="outline"
            size="sm"
            onClick={exportAnalyticsData}
            className="flex items-center gap-1"
          >
            <Download size={16} />
            <span>Export</span>
          </EnhancedButton>

          {/* Refresh button */}
          <EnhancedButton
            variant="outline"
            size="icon"
            onClick={fetchAnalyticsData}
            disabled={isLoading}
            className="h-9 w-9"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </EnhancedButton>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <ErrorMessage
          message={error}
          variant="error"
          size="sm"
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-primary/10 text-primary text-sm px-3 py-1 rounded-md flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin" />
          <span>Updating...</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedCard interactive hoverEffect="lift" className="overflow-hidden">
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground text-sm font-medium">Total Revenue</h3>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                <DollarSign size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2">
              <AnimatedGradientText
                text={`$${Math.round(totalRevenue).toLocaleString()}`}
                className="text-2xl font-bold"
                gradient="linear-gradient(to right, #3b82f6, #2563eb)"
              />
            </div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <ArrowUpRight size={16} className="mr-1" />
              <span className="font-medium">12.5%</span>
              <span className="ml-2 text-muted-foreground">vs last period</span>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard interactive hoverEffect="lift" className="overflow-hidden">
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground text-sm font-medium">Total Profit</h3>
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-2">
              <AnimatedGradientText
                text={`$${Math.round(totalProfit).toLocaleString()}`}
                className="text-2xl font-bold"
                gradient="linear-gradient(to right, #10b981, #059669)"
              />
            </div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <ArrowUpRight size={16} className="mr-1" />
              <span className="font-medium">18.3%</span>
              <span className="ml-2 text-muted-foreground">vs last period</span>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard interactive hoverEffect="lift" className="overflow-hidden">
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground text-sm font-medium">Active Customers</h3>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                <Users size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-2">
              <AnimatedGradientText
                text={totalCustomers.toLocaleString()}
                className="text-2xl font-bold"
                gradient="linear-gradient(to right, #8b5cf6, #7c3aed)"
              />
            </div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <ArrowUpRight size={16} className="mr-1" />
              <span className="font-medium">9.7%</span>
              <span className="ml-2 text-muted-foreground">vs last period</span>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard interactive hoverEffect="lift" className="overflow-hidden">
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground text-sm font-medium">Avg. Product Growth</h3>
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                <Package size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-2">
              <AnimatedGradientText
                text={`${averageGrowth.toFixed(1)}%`}
                className="text-2xl font-bold"
                gradient="linear-gradient(to right, #f59e0b, #d97706)"
              />
            </div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <ArrowUpRight size={16} className="mr-1" />
              <span className="font-medium">2.1%</span>
              <span className="ml-2 text-muted-foreground">vs last period</span>
            </div>
          </div>
        </EnhancedCard>
      </div>

      {/* Revenue Chart */}
      <EnhancedCard className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LineChartIcon className="text-primary" size={20} />
              <h2 className="text-xl font-semibold">Revenue & Profit</h2>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-muted-foreground cursor-help" title="Shows revenue, expenses, and profit over time" />
            </div>
          </div>
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
      </EnhancedCard>

      {/* Customer Growth and Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedCard className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="text-purple-600" size={20} />
                <h2 className="text-xl font-semibold">Customer Growth</h2>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-muted-foreground cursor-help" title="Shows new customers, active customers, and churn rate over time" />
              </div>
            </div>
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
        </EnhancedCard>

        <EnhancedCard className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-amber-600" size={20} />
                <h2 className="text-xl font-semibold">Product Performance</h2>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-muted-foreground cursor-help" title="Shows sales and growth by product" />
              </div>
            </div>
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
        </EnhancedCard>
      </div>
    </div>
  );
}

// Enhanced Summary Card Component
interface SummaryCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  gradient: string;
  icon?: React.ReactNode;
  description?: string;
  loading?: boolean;
}

function SummaryCard({
  title,
  value,
  prefix = "",
  suffix = "",
  change,
  gradient,
  icon,
  description,
  loading = false
}: SummaryCardProps) {
  return (
    <EnhancedCard interactive hoverEffect="lift" className="overflow-hidden">
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
          {icon && (
            <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full">
              {icon}
            </div>
          )}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
        )}

        <div className="mt-2">
          {loading ? (
            <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
          ) : (
            <AnimatedGradientText
              text={`${prefix}${Math.round(value).toLocaleString()}${suffix}`}
              className="text-2xl font-bold"
              gradient={gradient}
            />
          )}
        </div>

        <div className={`mt-2 flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {loading ? (
            <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
          ) : (
            <>
              {change >= 0 ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
              <span className="font-medium">
                {Math.abs(change)}%
              </span>
              <span className="ml-2 text-muted-foreground">vs last period</span>
            </>
          )}
        </div>
      </div>
    </EnhancedCard>
  );
}
