"use client";

import { useEffect } from "react";
import { useCopilotReadable } from "@copilotkit/react-core";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  change: number;
  icon: LucideIcon;
  color: "blue" | "red" | "green" | "purple" | "yellow";
}

export default function KPICard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: KPICardProps) {
  // Make the KPI card readable by CopilotKit
  useCopilotReadable({
    name: title.toLowerCase(),
    description: `Current ${title.toLowerCase()} information`,
    value: { value, change },
  });

  // Format the value with commas for thousands
  const formattedValue = value.toLocaleString();

  // Define color schemes based on the color prop
  const colorScheme = {
    blue: {
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      changeColor: change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      valueColor: "text-blue-600 dark:text-blue-400",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-900/10",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    red: {
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      changeColor: change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      valueColor: "text-red-600 dark:text-red-400",
      hoverBg: "hover:bg-red-50 dark:hover:bg-red-900/10",
      borderColor: "border-red-200 dark:border-red-800",
    },
    green: {
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      changeColor: change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      valueColor: "text-green-600 dark:text-green-400",
      hoverBg: "hover:bg-green-50 dark:hover:bg-green-900/10",
      borderColor: "border-green-200 dark:border-green-800",
    },
    purple: {
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      changeColor: change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      valueColor: "text-purple-600 dark:text-purple-400",
      hoverBg: "hover:bg-purple-50 dark:hover:bg-purple-900/10",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    yellow: {
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      changeColor: change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      valueColor: "text-yellow-600 dark:text-yellow-400",
      hoverBg: "hover:bg-yellow-50 dark:hover:bg-yellow-900/10",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
  }[color];

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-md", 
      colorScheme.hoverBg,
      colorScheme.borderColor
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`${colorScheme.iconBg} p-3 rounded-full`}>
            <Icon className={`${colorScheme.iconColor}`} size={24} />
          </div>
          <div className={`${colorScheme.changeColor} flex items-center text-sm font-medium`}>
            {change >= 0 ? "+" : ""}
            {change}%
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-card-foreground/70 text-sm font-medium">{title}</h3>
          <div className={`text-2xl font-bold ${colorScheme.valueColor}`}>
            {formattedValue}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
