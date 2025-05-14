"use client";

import { useState, useEffect } from "react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ShineBorder } from "@/components/ui/shine-border";
import { MagicCard } from "@/components/magicui/magic-card";
import { WordRotate } from "@/components/magicui/word-rotate";

export default function EnhancedWelcomeSection() {
  const [greeting, setGreeting] = useState("Welcome back");
  const [userName, setUserName] = useState("User");
  const [currentTime, setCurrentTime] = useState(new Date());

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

    // In a real app, you would fetch the user's name from an API or auth provider
    // For now, we'll just use a placeholder
    setUserName("Admin");

    // Update the current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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

  // Get the number of pending tasks (in a real app, this would come from an API)
  const pendingTasks = 3;
  const upcomingMeetings = 2;
  const unreadMessages = 5;

  return (
    <div className="relative group transition-all duration-300 hover:scale-[1.01]">
      <MagicCard
        className="rounded-xl overflow-hidden h-full"
        focus
        glare
        glareSize={0.3}
        glareOpacity={0.2}
        glarePosition="all"
        glareColor="rgba(139, 92, 246, 0.6)"
        glareBorderRadius="0.75rem"
      >
        <div className="bg-card rounded-xl shadow-sm p-6 h-full">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <AnimatedGradientText
                  text={`${greeting},`}
                  className="text-2xl font-bold"
                  gradient="linear-gradient(to right, var(--primary), var(--accent))"
                />
                <WordRotate
                  words={[userName, "Manager", "Executive", "Admin"]}
                  className="text-2xl font-bold text-primary"
                />
                <span className="text-2xl font-bold text-primary">!</span>
              </div>
              <p className="text-card-foreground/70 mt-1">
                {formattedDate} • {formattedTime}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 transition-all duration-300 hover:bg-primary/15 dark:hover:bg-primary/25">
                <h3 className="text-primary font-medium mb-1">Pending Tasks</h3>
                <p className="text-2xl font-bold text-primary">{pendingTasks}</p>
              </div>
              <div className="bg-accent/10 dark:bg-accent/20 rounded-lg p-4 transition-all duration-300 hover:bg-accent/15 dark:hover:bg-accent/25">
                <h3 className="text-accent-foreground font-medium mb-1">Upcoming Meetings</h3>
                <p className="text-2xl font-bold text-accent-foreground">{upcomingMeetings}</p>
              </div>
              <div className="bg-secondary/10 dark:bg-secondary/20 rounded-lg p-4 transition-all duration-300 hover:bg-secondary/15 dark:hover:bg-secondary/25">
                <h3 className="text-secondary-foreground font-medium mb-1">Unread Messages</h3>
                <p className="text-2xl font-bold text-secondary-foreground">{unreadMessages}</p>
              </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-card-foreground font-medium mb-2">Quick Tips</h3>
              <ul className="text-card-foreground/70 space-y-1 text-sm">
                <li className="flex items-center gap-1">
                  <span className="text-primary">•</span> Use the AI assistant to help you navigate the system
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-primary">•</span> Check the system status panel for service availability
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-primary">•</span> Explore the agent actions for automated workflows
                </li>
              </ul>
            </div>
          </div>
        </div>
      </MagicCard>
    </div>
  );
}
