"use client";

import { useState, useEffect, useCallback } from "react";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Bell,
  RefreshCw,
  User,
  Clock,
  BarChart,
  ChevronRight
} from "lucide-react";
import { useRateLimit } from "@/context/RateLimitContext";

interface WelcomeSectionProps {
  className?: string;
  userName?: string;
  showRefreshButton?: boolean;
}

export default function WelcomeSection({
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
  const [activeTab, setActiveTab] = useState<'tasks' | 'meetings' | 'messages'>('tasks');
  const { throttle } = useRateLimit();

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

  // Update the greeting based on the time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }

    // Update the current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Format the date and time
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(currentTime);

  // Fetch user data (tasks, meetings, messages, etc.)
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);

    try {
      // In a real implementation, you would fetch data from an API
      // For now, we'll simulate with random data
      await throttle('welcome-data-refresh', async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setPendingTasks(Math.floor(Math.random() * 5) + 1);
        setUpcomingMeetings(Math.floor(Math.random() * 3) + 1);
        setUnreadMessages(Math.floor(Math.random() * 8) + 1);
        setNotifications(Math.floor(Math.random() * 3));
      }, 3000);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [throttle]);

  // Fetch data on component mount
  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sample tasks data
  const tasks = [
    { id: 1, title: "Review quarterly report", dueDate: "Today", priority: "high" },
    { id: 2, title: "Prepare presentation for client meeting", dueDate: "Tomorrow", priority: "medium" },
    { id: 3, title: "Update project documentation", dueDate: "Friday", priority: "low" },
  ];

  // Sample meetings data
  const meetings = [
    { id: 1, title: "Team standup", time: "10:00 AM", duration: "30m" },
    { id: 2, title: "Client presentation", time: "2:00 PM", duration: "1h" },
  ];

  // Sample messages data
  const messages = [
    { id: 1, sender: "John Doe", content: "Can we discuss the project timeline?", time: "9:30 AM" },
    { id: 2, sender: "Jane Smith", content: "I've sent you the updated designs", time: "Yesterday" },
    { id: 3, sender: "Alex Johnson", content: "Meeting notes from yesterday", time: "Yesterday" },
    { id: 4, sender: "Sarah Williams", content: "Question about the new feature", time: "Monday" },
    { id: 5, sender: "Mike Brown", content: "Updates on the marketing campaign", time: "Monday" },
  ];

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              {greeting}, {userName}!
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Clock size={14} />
              <span className="text-sm">
                {formattedDate} • {formattedTime}
              </span>
            </div>
          </div>
          {showRefreshButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchUserData()}
              disabled={isLoading}
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col items-center justify-center p-3 bg-primary/10 rounded-lg">
            <CheckSquare className="text-primary mb-1" size={20} />
            <span className="text-xl font-bold">{pendingTasks}</span>
            <span className="text-xs text-muted-foreground">Tasks</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-blue-500/10 rounded-lg">
            <Calendar className="text-blue-500 mb-1" size={20} />
            <span className="text-xl font-bold">{upcomingMeetings}</span>
            <span className="text-xs text-muted-foreground">Meetings</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-green-500/10 rounded-lg">
            <MessageSquare className="text-green-500 mb-1" size={20} />
            <span className="text-xl font-bold">{unreadMessages}</span>
            <span className="text-xs text-muted-foreground">Messages</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-yellow-500/10 rounded-lg">
            <Bell className="text-yellow-500 mb-1" size={20} />
            <span className="text-xl font-bold">{notifications}</span>
            <span className="text-xs text-muted-foreground">Alerts</span>
          </div>
        </div>

        <Tabs defaultValue="tasks" onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <CheckSquare className="text-primary mt-0.5" size={16} />
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground">Due: {task.dueDate}</div>
                  </div>
                </div>
                <Badge variant={
                  task.priority === "high" ? "destructive" : 
                  task.priority === "medium" ? "default" : 
                  "outline"
                }>
                  {task.priority}
                </Badge>
              </div>
            ))}
            <Button variant="ghost" className="w-full mt-2 text-primary" size="sm">
              <span>View all tasks</span>
              <ChevronRight size={16} />
            </Button>
          </TabsContent>
          
          <TabsContent value="meetings" className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Calendar className="text-blue-500 mt-0.5" size={16} />
                  <div>
                    <div className="font-medium">{meeting.title}</div>
                    <div className="text-sm text-muted-foreground">{meeting.time} ({meeting.duration})</div>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full mt-2 text-primary" size="sm">
              <span>View calendar</span>
              <ChevronRight size={16} />
            </Button>
          </TabsContent>
          
          <TabsContent value="messages" className="space-y-4">
            {messages.slice(0, 3).map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <User className="text-green-500 mt-0.5" size={16} />
                <div>
                  <div className="font-medium">{message.sender}</div>
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs text-muted-foreground">{message.time}</div>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full mt-2 text-primary" size="sm">
              <span>View all messages</span>
              <ChevronRight size={16} />
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
