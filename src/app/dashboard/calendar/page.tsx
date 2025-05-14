"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";

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
      const newEvent = {
        id: String(events.length + 1),
        title,
        start: new Date(start),
        end: new Date(end),
        allDay: allDay || false,
      };
      
      setEvents([...events, newEvent]);
      
      return `Added event: ${title}`;
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
    },
  });

  const handleEventClick = (info: any) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      allDay: info.event.allDay,
    });
    setShowEventModal(true);
  };

  const handleDateSelect = (selectInfo: any) => {
    const title = prompt("Please enter a title for your event");
    if (title) {
      const newEvent = {
        id: String(events.length + 1),
        title,
        start: selectInfo.start,
        end: selectInfo.end,
        allDay: selectInfo.allDay,
      };
      setEvents([...events, newEvent]);
    }
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      handleCloseModal();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Calendar</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
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
        />
      </div>
      
      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{selectedEvent.title}</h2>
            <div className="mb-4">
              <p className="text-slate-600">
                <strong>Start:</strong> {selectedEvent.start.toLocaleString()}
              </p>
              <p className="text-slate-600">
                <strong>End:</strong> {selectedEvent.end.toLocaleString()}
              </p>
              <p className="text-slate-600">
                <strong>All Day:</strong> {selectedEvent.allDay ? "Yes" : "No"}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
