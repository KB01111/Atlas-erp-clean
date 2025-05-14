"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart,
  Calendar,
  FileText,
  Settings,
  Bot,
  Link as LinkIcon,
  Brain,
  Workflow
} from "lucide-react";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { Ripple } from "@/components/magicui/ripple";
import { BorderBeam } from "@/components/magicui/border-beam";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { memo } from "react";

// Note: This layout has been enhanced with MagicUI components
// See Memory Bank documentation: UI-Improvements.md for details

// Memoize the NavItem component to prevent unnecessary re-renders
const NavItem = memo(({ item, isActive }: {
  item: { name: string; href: string; icon: any };
  isActive: boolean;
}) => {
  const Icon = item.icon;

  return (
    <li className="relative">
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 ${
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20 translate-x-1"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
        }`}
      >
        <Icon size={20} className={isActive ? "animate-pulse" : ""} />
        <span>{item.name}</span>
        {isActive && (
          <>
            <div className="absolute right-0 w-1 h-6 bg-sidebar-primary-foreground rounded-l-md" />
            <Ripple
              className="opacity-30"
              mainCircleSize={100}
              numCircles={3}
            />
          </>
        )}
      </Link>
    </li>
  );
});

NavItem.displayName = 'NavItem';

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart,
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    name: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    name: "Knowledge",
    href: "/dashboard/knowledge",
    icon: Brain,
  },
  {
    name: "Workflows",
    href: "/dashboard/workflows",
    icon: Workflow,
  },
  {
    name: "Integrations",
    href: "/dashboard/integrations",
    icon: LinkIcon,
  },
  {
    name: "Agents",
    href: "/dashboard/agents",
    icon: Bot,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      {/* Scroll Progress Indicator */}
      <ScrollProgress color="var(--primary)" height={3} />

      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground p-4 relative overflow-hidden">
        <DotPattern
          width={40} // Increased spacing between dots
          height={40} // Increased spacing between dots
          cx={1}
          cy={1}
          cr={1}
          glow={false} // Disable glow effect for better performance
          className="absolute inset-0 text-sidebar-primary/10 [mask-image:linear-gradient(to_bottom_right,black,transparent,transparent)]"
        />

        <div className="relative z-10">
          <div className="mb-8">
            <BorderBeam
              className="p-3 rounded-lg"
              beamColor="var(--sidebar-primary)"
              beamDuration={2}
              beamSize={1}
            >
              <AnimatedGradientText
                text="Atlas-ERP"
                className="text-2xl font-bold"
                gradient="linear-gradient(to right, var(--primary), var(--sidebar-primary), var(--accent))"
              />
            </BorderBeam>
          </div>

          <nav>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                />
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 bg-background relative">
        {/* Simplified grid pattern with reduced animation */}
        <AnimatedGridPattern
          gridSize={80} // Larger grid size for fewer lines
          lineColor="var(--foreground)"
          lineOpacity={0.02} // Reduced opacity
          lineWidth={1}
          animationDuration={120} // Much slower animation
          className="absolute inset-0"
        />
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
