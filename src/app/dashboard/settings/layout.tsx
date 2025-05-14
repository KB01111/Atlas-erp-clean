"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, 
  Bot, 
  Database, 
  Key, 
  Server, 
  Shield, 
  User, 
  Bell 
} from "lucide-react";

const settingsNavItems = [
  {
    name: "General",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    name: "LLM",
    href: "/dashboard/settings/llm",
    icon: Bot,
  },
  {
    name: "Database",
    href: "/dashboard/settings/database",
    icon: Database,
  },
  {
    name: "API Keys",
    href: "/dashboard/settings/api-keys",
    icon: Key,
  },
  {
    name: "Integrations",
    href: "/dashboard/settings/integrations",
    icon: Server,
  },
  {
    name: "Security",
    href: "/dashboard/settings/security",
    icon: Shield,
  },
  {
    name: "User Profile",
    href: "/dashboard/settings/profile",
    icon: User,
  },
  {
    name: "Notifications",
    href: "/dashboard/settings/notifications",
    icon: Bell,
  },
];

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation */}
        <aside className="w-full md:w-64 bg-white rounded-lg shadow-md p-4 h-fit">
          <nav>
            <ul className="space-y-1">
              {settingsNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Settings Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
