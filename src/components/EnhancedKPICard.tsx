"use client";

import { useEffect } from "react";
import { useCopilotReadable } from "@copilotkit/react-core";
import { LucideIcon } from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ShineBorder } from "@/components/ui/shine-border";
import { MagicCard } from "@/components/magicui/magic-card";
import { NumberTicker } from "@/components/magicui/number-ticker";

interface EnhancedKPICardProps {
  title: string;
  value: number;
  change: number;
  icon: LucideIcon;
  color: "blue" | "red" | "green" | "purple" | "yellow";
}

export default function EnhancedKPICard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: EnhancedKPICardProps) {
  // Make the KPI card readable by CopilotKit
  // This must be at the top level of the component, not inside useEffect
  useCopilotReadable({
    name: title.toLowerCase(),
    description: `Current ${title.toLowerCase()} information`,
    value: { value, change },
  });

  // Format the value with commas for thousands
  const formattedValue = value.toLocaleString();

  // Determine the color scheme based on the color prop
  const getColorScheme = () => {
    switch (color) {
      case "blue":
        return {
          bgGradient: "linear-gradient(to right, #3b82f6, #2563eb)",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          borderColor: "rgba(59, 130, 246, 0.2)",
          shineBorderColor: "rgba(59, 130, 246, 0.6)",
          changeColor: change >= 0 ? "text-green-500" : "text-red-500",
        };
      case "red":
        return {
          bgGradient: "linear-gradient(to right, #ef4444, #dc2626)",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          borderColor: "rgba(239, 68, 68, 0.2)",
          shineBorderColor: "rgba(239, 68, 68, 0.6)",
          changeColor: change >= 0 ? "text-green-500" : "text-red-500",
        };
      case "green":
        return {
          bgGradient: "linear-gradient(to right, #22c55e, #16a34a)",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          borderColor: "rgba(34, 197, 94, 0.2)",
          shineBorderColor: "rgba(34, 197, 94, 0.6)",
          changeColor: change >= 0 ? "text-green-500" : "text-red-500",
        };
      case "purple":
        return {
          bgGradient: "linear-gradient(to right, #8b5cf6, #7c3aed)",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
          borderColor: "rgba(139, 92, 246, 0.2)",
          shineBorderColor: "rgba(139, 92, 246, 0.6)",
          changeColor: change >= 0 ? "text-green-500" : "text-red-500",
        };
      case "yellow":
        return {
          bgGradient: "linear-gradient(to right, #f59e0b, #d97706)",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          borderColor: "rgba(245, 158, 11, 0.2)",
          shineBorderColor: "rgba(245, 158, 11, 0.6)",
          changeColor: change >= 0 ? "text-green-500" : "text-red-500",
        };
      default:
        return {
          bgGradient: "linear-gradient(to right, #3b82f6, #2563eb)",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          borderColor: "rgba(59, 130, 246, 0.2)",
          shineBorderColor: "rgba(59, 130, 246, 0.6)",
          changeColor: change >= 0 ? "text-green-500" : "text-red-500",
        };
    }
  };

  const colorScheme = getColorScheme();

  return (
    <div className="relative group transition-all duration-300 hover:scale-[1.02]">
      <MagicCard
        className="rounded-xl overflow-hidden"
        focus
        glare
        glareSize={0.4}
        glareOpacity={0.2}
        glarePosition="all"
        glareColor={colorScheme.iconColor}
        glareBorderRadius="0.75rem"
      >
        <div className="bg-card rounded-xl shadow-sm p-6">
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
            <div className="text-2xl font-bold">
              <NumberTicker
                value={value}
                className="text-2xl font-bold"
                style={{
                  background: colorScheme.bgGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
                duration={1}
              />
            </div>
          </div>
        </div>
      </MagicCard>
    </div>
  );
}
