"use client";

import { useState, useEffect, useCallback } from "react";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { BorderContainer } from "@/components/ui/shine-border";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { TextRotate } from "@/components/ui/text-rotate";
import { NumberDisplay } from "@/components/ui/number-display";
import { DotBackground } from "@/components/ui/dot-background";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Bell,
  RefreshCw,
  ChevronRight,
  User,
  Clock,
  BarChart,
  Sparkles
} from "lucide-react";
import { useRateLimit } from "@/context/RateLimitContext";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";

interface WelcomeSectionProps {
  className?: string;
  userName?: string;
  showRefreshButton?: boolean;
}

export default function EnhancedWelcomeSection({
  className = "",
  userName: initialUserName,
  showRefreshButton = true
}: WelcomeSectionProps) {
  const [greeting, setGreeting] = useState("Welcome back");
  const [userName, setUserName] = useState(initialUserName || "User");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingTasks, setPendingTasks] = useState(3);
  const [upcomingMeetings, setUpcomingMeetings] = useState(2);
  const [unreadMessages, setUnreadMessages] = useState(5);
  const [notifications, setNotifications] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshAnimation, setRefreshAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'meetings' | 'messages'>('tasks');
  const { throttle } = useRateLimit();
  const { isLowEndDevice } = usePerformanceOptimization();

  // Make the welcome section readable by CopilotKit
  useCopilotReadable({
    name: "welcome_section",
    description: "Welcome section with user information and quick stats",
    value: {
      userName,
      pendingTasks,
      upcomingMeetings,
      unreadMessages,
      notifications,
      currentTime: currentTime.toISOString(),
      activeTab,
    },
  });

  // Register the refresh action with CopilotKit
  useCopilotAction({
    name: "refresh_welcome_data",
    description: "Refresh the welcome section data",
    parameters: [],
    handler: async () => {
      await fetchUserData();
      return "Welcome section data refreshed successfully";
    },
  });

  // Fetch user data from API (simulated)
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setRefreshAnimation(true);

    try {
      // In a real app, you would fetch this data from an API
      // For now, we'll simulate a delay and use placeholder data
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate random data changes
      setPendingTasks(Math.floor(Math.random() * 5) + 1);
      setUpcomingMeetings(Math.floor(Math.random() * 3) + 1);
      setUnreadMessages(Math.floor(Math.random() * 8) + 1);
      setNotifications(Math.floor(Math.random() * 3));

      // In a real app, you would fetch the user's name from an API or auth provider
      if (!initialUserName) {
        setUserName("Admin");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
      // Reset refresh animation after a short delay
      setTimeout(() => setRefreshAnimation(false), 500);
    }
  }, [initialUserName]);

  // Update the greeting based on the time of day
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting("Good morning");
      } else if (hour < 18) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    };

    // Initial update
    updateGreeting();
    fetchUserData();

    // Update the current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
      updateGreeting();
    }, 60000);

    // Refresh data periodically (throttled)
    // Use a longer interval for low-end devices
    const refreshInterval = isLowEndDevice ? 60000 : 30000;
    const dataInterval = setInterval(() => {
      throttle("welcome-data-refresh", fetchUserData, refreshInterval);
    }, refreshInterval);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, [fetchUserData, throttle, isLowEndDevice]);

  // Handle tab change
  const handleTabChange = (tab: 'tasks' | 'meetings' | 'messages') => {
    setActiveTab(tab);
  };

  // Format the current date and time
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(currentTime);

  // Get time-based greeting color
  const getGreetingGradient = () => {
    const hour = currentTime.getHours();
    if (hour < 12) {
      return "linear-gradient(to right, #f97316, #eab308)"; // Morning: orange to yellow
    } else if (hour < 18) {
      return "linear-gradient(to right, #3b82f6, #8b5cf6)"; // Afternoon: blue to purple
    } else {
      return "linear-gradient(to right, #8b5cf6, #ec4899)"; // Evening: purple to pink
    }
  };

  return (
    <div className={`relative group transition-all duration-300 hover:scale-[1.01] ${className}`}>
      <EnhancedCard
        className="rounded-xl overflow-hidden h-full"
        interactive
        hoverEffect="shadow"
      >
        <BorderContainer variant="primary" rounded="xl" className="p-0.5 h-full">
          <div className="bg-card rounded-xl shadow-sm p-6 h-full relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <DotBackground
                dotSpacing={32}
                dotSize={2}
                dotOpacity={0.2}
                className="absolute inset-0 text-primary"
              />
            </div>

            <div className="flex flex-col h-full relative z-10">
              {/* Header with greeting and time */}
              <div className="mb-6 relative">
                <div className="flex items-center gap-2">
                  <AnimatedGradientText
                    text={`${greeting},`}
                    className="text-2xl font-bold"
                    gradient={getGreetingGradient()}
                    duration={6}
                  />
                  <TextRotate
                    words={[userName, "Manager", "Executive", "Admin"]}
                    className="text-2xl font-bold text-primary"
                    interval={3000}
                    variant="primary"
                    weight="bold"
                    size="3xl"
                  />
                  <span className="text-2xl font-bold text-primary">!</span>

                  {/* Subtle glow effect behind greeting */}
                  <div className="absolute -left-4 -top-4 -z-10 w-16 h-16 rounded-full bg-primary/10 blur-xl"></div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-card-foreground/70">
                    <Clock size={14} />
                    <p className="text-sm">
                      {formattedDate} • {formattedTime}
                    </p>
                  </div>

                  {/* Refresh button */}
                  {showRefreshButton && (
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchUserData()}
                      className="h-8 w-8 p-0"
                      disabled={isLoading}
                    >
                      <RefreshCw
                        size={16}
                        className={`text-primary ${isLoading || refreshAnimation ? 'animate-spin' : ''}`}
                      />
                    </EnhancedButton>
                  )}
                </div>

                {/* Simple border effect */}
                <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-primary/30"></div>
              </div>

              {/* Tabs for different stats */}
              <div className="flex border-b border-border mb-4">
                <button
                  onClick={() => handleTabChange('tasks')}
                  className={`px-4 py-2 text-sm font-medium relative ${
                    activeTab === 'tasks'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} />
                    <span>Tasks</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabChange('meetings')}
                  className={`px-4 py-2 text-sm font-medium relative ${
                    activeTab === 'meetings'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Meetings</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabChange('messages')}
                  className={`px-4 py-2 text-sm font-medium relative ${
                    activeTab === 'messages'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    <span>Messages</span>
                  </div>
                </button>
              </div>

              {/* Stats content based on active tab */}
              <div className="mb-6">
                {activeTab === 'tasks' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 transition-all duration-300 hover:bg-primary/15 dark:hover:bg-primary/25 flex items-center">
                      <div className="mr-3 bg-primary/20 dark:bg-primary/30 p-2 rounded-full">
                        <CheckSquare size={18} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-primary font-medium mb-1 text-sm">Pending Tasks</h3>
                        <div className="text-2xl font-bold text-primary">
                          <NumberDisplay value={pendingTasks} variant="primary" weight="bold" size="2xl" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-destructive/10 dark:bg-destructive/20 rounded-lg p-4 transition-all duration-300 hover:bg-destructive/15 dark:hover:bg-destructive/25 flex items-center">
                      <div className="mr-3 bg-destructive/20 dark:bg-destructive/30 p-2 rounded-full">
                        <Bell size={18} className="text-destructive" />
                      </div>
                      <div>
                        <h3 className="text-destructive font-medium mb-1 text-sm">Notifications</h3>
                        <div className="text-2xl font-bold text-destructive">
                          <NumberDisplay value={notifications} variant="destructive" weight="bold" size="2xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'meetings' && (
                  <div className="bg-accent/10 dark:bg-accent/20 rounded-lg p-4 transition-all duration-300 hover:bg-accent/15 dark:hover:bg-accent/25">
                    <div className="flex items-center mb-3">
                      <div className="mr-3 bg-accent/20 dark:bg-accent/30 p-2 rounded-full">
                        <Calendar size={18} className="text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="text-accent-foreground font-medium text-sm">Upcoming Meetings</h3>
                        <div className="text-2xl font-bold text-accent-foreground">
                          <NumberDisplay value={upcomingMeetings} variant="accent" weight="bold" size="2xl" />
                        </div>
                      </div>
                    </div>

                    {/* Sample meeting list */}
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between items-center p-2 bg-accent/5 rounded">
                        <div>
                          <p className="font-medium">Weekly Planning</p>
                          <p className="text-xs text-muted-foreground">Today, 2:00 PM</p>
                        </div>
                        <EnhancedButton variant="outline" size="sm">
                          <Calendar size={14} className="mr-1" />
                          Join
                        </EnhancedButton>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-accent/5 rounded">
                        <div>
                          <p className="font-medium">Client Presentation</p>
                          <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
                        </div>
                        <EnhancedButton variant="outline" size="sm">
                          <Calendar size={14} className="mr-1" />
                          Join
                        </EnhancedButton>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'messages' && (
                  <div className="bg-secondary/10 dark:bg-secondary/20 rounded-lg p-4 transition-all duration-300 hover:bg-secondary/15 dark:hover:bg-secondary/25">
                    <div className="flex items-center mb-3">
                      <div className="mr-3 bg-secondary/20 dark:bg-secondary/30 p-2 rounded-full">
                        <MessageSquare size={18} className="text-secondary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-secondary-foreground font-medium text-sm">Unread Messages</h3>
                        <div className="text-2xl font-bold text-secondary-foreground">
                          <NumberDisplay value={unreadMessages} variant="secondary" weight="bold" size="2xl" />
                        </div>
                      </div>
                    </div>

                    {/* Sample message list */}
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-3 p-2 bg-secondary/5 rounded">
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                          <User size={16} className="text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Sarah Johnson</p>
                          <p className="text-xs text-muted-foreground truncate">Can we discuss the project timeline?</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-2 bg-secondary/5 rounded">
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                          <User size={16} className="text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Mark Williams</p>
                          <p className="text-xs text-muted-foreground truncate">I've updated the financial report</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick tips */}
              <div className="mt-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-primary" />
                  <h3 className="text-card-foreground font-medium">Quick Tips</h3>
                </div>
                <ul className="text-card-foreground/70 space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-primary" />
                    Use the AI assistant to help you navigate the system
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-primary" />
                    Check the system status panel for service availability
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-primary" />
                    Explore the agent actions for automated workflows
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </BorderContainer>
      </EnhancedCard>
    </div>
  );
}
