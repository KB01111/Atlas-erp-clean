"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { useRateLimit } from "@/context/RateLimitContext";
import {
  Calendar as CalendarIcon,
  Plus,
  X,
  Edit,
  Trash,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  Search
} from "lucide-react";

// Sample calendar events
const initialEvents = [
  {
    id: "1",
    title: "Client Meeting - ABC Corp",
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(11, 30, 0, 0)),
  },
  {
    id: "2",
    title: "Team Standup",
    start: new Date(new Date().setHours(9, 0, 0, 0)),
    end: new Date(new Date().setHours(9, 30, 0, 0)),
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  },
  {
    id: "3",
    title: "Quarterly Review",
    start: new Date(new Date().setDate(new Date().getDate() + 5)),
    end: new Date(new Date().setDate(new Date().getDate() + 5)),
    allDay: true,
  },
];

export default function CalendarPage() {
  const [events, setEvents] = useState(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
    allDay: false,
  });
  const { throttle } = useRateLimit();
  const calendarRef = useRef<any>(null);

  // Function to fetch events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, you would fetch events from an API
      // For now, we'll simulate a delay and use the static data
      await throttle('calendar-refresh', async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        // In a real implementation, you would fetch events from an API
        // setEvents(fetchedEvents);
      }, 5000);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [throttle]);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Make calendar events readable by the AI
  useCopilotReadable({
    name: "calendar_events",
    description: "List of all calendar events",
    value: events,
  });

  // Add event action for the AI
  useCopilotAction({
    name: "add_calendar_event",
    description: "Add a new event to the calendar",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Title of the event",
        required: true,
      },
      {
        name: "start",
        type: "string",
        description: "Start date and time (ISO format)",
        required: true,
      },
      {
        name: "end",
        type: "string",
        description: "End date and time (ISO format)",
        required: true,
      },
      {
        name: "allDay",
        type: "boolean",
        description: "Whether the event is all day",
        required: false,
      },
    ],
    handler: async ({ title, start, end, allDay }) => {
      try {
        const newEvent = {
          id: String(events.length + 1),
          title,
          start: new Date(start),
          end: new Date(end),
          allDay: allDay || false,
        };

        setEvents([...events, newEvent]);

        return `Added event: ${title}`;
      } catch (error) {
        console.error('Error adding event:', error);
        return `Error adding event: ${error.message}`;
      }
    },
  });

  // Find event action for the AI
  useCopilotAction({
    name: "find_calendar_events",
    description: "Find calendar events by title or date range",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Title to search for (partial match)",
        required: false,
      },
      {
        name: "startDate",
        type: "string",
        description: "Start date (ISO format)",
        required: false,
      },
      {
        name: "endDate",
        type: "string",
        description: "End date (ISO format)",
        required: false,
      },
    ],
    handler: async ({ title, startDate, endDate }) => {
      try {
        let filteredEvents = [...events];

        if (title) {
          filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(title.toLowerCase())
          );
        }

        if (startDate) {
          const start = new Date(startDate);
          filteredEvents = filteredEvents.filter(event =>
            new Date(event.start) >= start
          );
        }

        if (endDate) {
          const end = new Date(endDate);
          filteredEvents = filteredEvents.filter(event =>
            new Date(event.end) <= end
          );
        }

        return filteredEvents;
      } catch (error) {
        console.error('Error finding events:', error);
        return `Error finding events: ${error.message}`;
      }
    },
  });

  // Export events action for the AI
  useCopilotAction({
    name: "export_calendar_events",
    description: "Export calendar events to CSV",
    parameters: [],
    handler: async () => {
      try {
        exportEvents();
        return "Events exported successfully";
      } catch (error) {
        console.error('Error exporting events:', error);
        return `Error exporting events: ${error.message}`;
      }
    },
  });

  // Export events to CSV
  const exportEvents = useCallback(() => {
    try {
      // Create CSV content
      const csvContent = [
        // Headers
        ['ID', 'Title', 'Start', 'End', 'All Day'].join(','),
        // Data rows
        ...events.map(event => [
          event.id,
          `"${event.title.replace(/"/g, '""')}"`, // Escape quotes in title
          new Date(event.start).toISOString(),
          new Date(event.end).toISOString(),
          event.allDay ? 'true' : 'false',
        ].join(','))
      ].join('\n');

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `calendar-events-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting events:', error);
      setError('Failed to export events');
    }
  }, [events]);

  // Handle event click
  const handleEventClick = useCallback((info: unknown) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      allDay: info.event.allDay,
    });
    setShowEventModal(true);
  }, []);

  // Handle date select
  const handleDateSelect = useCallback((selectInfo: unknown) => {
    setNewEvent({
      title: "",
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay,
    });
    setShowAddEventModal(true);
  }, []);

  // Handle add event
  const handleAddEvent = useCallback(() => {
    if (newEvent.title.trim()) {
      const event = {
        id: String(events.length + 1),
        ...newEvent,
      };
      setEvents([...events, event]);
      setShowAddEventModal(false);
      setNewEvent({
        title: "",
        start: new Date(),
        end: new Date(new Date().getTime() + 60 * 60 * 1000),
        allDay: false,
      });
    }
  }, [events, newEvent]);

  // Handle close modal
  const handleCloseModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
  }, []);

  // Handle close add event modal
  const handleCloseAddEventModal = useCallback(() => {
    setShowAddEventModal(false);
    setNewEvent({
      title: "",
      start: new Date(),
      end: new Date(new Date().getTime() + 60 * 60 * 1000),
      allDay: false,
    });
  }, []);

  // Handle delete event
  const handleDeleteEvent = useCallback(() => {
    if (selectedEvent) {
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      handleCloseModal();
    }
  }, [events, selectedEvent, handleCloseModal]);

  // Handle edit event
  const handleEditEvent = useCallback(() => {
    if (selectedEvent) {
      setNewEvent({
        title: selectedEvent.title,
        start: selectedEvent.start,
        end: selectedEvent.end,
        allDay: selectedEvent.allDay,
      });
      setShowAddEventModal(true);
      setShowEventModal(false);
    }
  }, [selectedEvent]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.gotoDate(new Date());

      // Find matching events
      const matchingEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matchingEvents.length > 0) {
        // Go to the date of the first matching event
        calendar.gotoDate(matchingEvents[0].start);
      }
    }
  }, [searchQuery, events]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <AnimatedGradientText
            text="Calendar"
            className="text-3xl font-bold"
            gradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)"
          />
          <p className="text-muted-foreground mt-1">
            Manage your schedule and events
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="px-3 py-2 pr-8 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Add event button */}
          <EnhancedButton
            variant="default"
            size="sm"
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-1"
          >
            <Plus size={16} />
            <span>Add Event</span>
          </EnhancedButton>

          {/* Export button */}
          <EnhancedButton
            variant="outline"
            size="sm"
            onClick={exportEvents}
            className="flex items-center gap-1"
          >
            <Download size={16} />
            <span>Export</span>
          </EnhancedButton>

          {/* Refresh button */}
          <EnhancedButton
            variant="outline"
            size="icon"
            onClick={fetchEvents}
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
          onRetry={fetchEvents}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-primary/10 text-primary text-sm px-3 py-1 rounded-md flex items-center gap-2 z-10">
          <RefreshCw size={14} className="animate-spin" />
          <span>Updating...</span>
        </div>
      )}

      <EnhancedCard className="overflow-hidden">
        <div className="p-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={view}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            eventClick={handleEventClick}
            select={handleDateSelect}
            height="auto"
            viewDidMount={(viewInfo) => setView(viewInfo.view.type as unknown)}
          />
        </div>
      </EnhancedCard>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <EnhancedCard className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon size={16} />
                  <p>
                    <strong>Start:</strong> {selectedEvent.start.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon size={16} />
                  <p>
                    <strong>End:</strong> {selectedEvent.end.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon size={16} />
                  <p>
                    <strong>All Day:</strong> {selectedEvent.allDay ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={handleEditEvent}
                  className="flex items-center gap-1"
                >
                  <Edit size={16} />
                  Edit
                </EnhancedButton>

                <EnhancedButton
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteEvent}
                  className="flex items-center gap-1"
                >
                  <Trash size={16} />
                  Delete
                </EnhancedButton>
              </div>
            </div>
          </EnhancedCard>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <EnhancedCard className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">
                  {selectedEvent ? "Edit Event" : "Add Event"}
                </h2>
                <button
                  onClick={handleCloseAddEventModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={new Date(newEvent.start).toISOString().slice(0, 16)}
                    onChange={(e) => setNewEvent({...newEvent, start: new Date(e.target.value)})}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={new Date(newEvent.end).toISOString().slice(0, 16)}
                    onChange={(e) => setNewEvent({...newEvent, end: new Date(e.target.value)})}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={newEvent.allDay}
                    onChange={(e) => setNewEvent({...newEvent, allDay: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="allDay" className="text-sm text-muted-foreground">
                    All Day
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={handleCloseAddEventModal}
                >
                  Cancel
                </EnhancedButton>

                <EnhancedButton
                  variant="default"
                  size="sm"
                  onClick={handleAddEvent}
                  disabled={!newEvent.title.trim()}
                >
                  {selectedEvent ? "Update" : "Add"}
                </EnhancedButton>
              </div>
            </div>
          </EnhancedCard>
        </div>
      )}
    </div>
  );
}
