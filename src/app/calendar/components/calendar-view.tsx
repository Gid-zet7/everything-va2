"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { api } from "@/trpc/react";

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  calendars: any[];
}

export function CalendarView({
  selectedDate,
  onDateSelect,
  calendars,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);

  // Get the first day of the month and the number of days
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const lastDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // Fetch events for the current month
  const { data: monthEvents } = api.calendar.getUpcomingEvents.useQuery({
    days: 365, // Get events for the whole year to show on calendar
  });

  useEffect(() => {
    if (monthEvents) {
      setEvents(monthEvents);
    }
  }, [monthEvents]);

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toDateString();
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === dateString;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Generate calendar grid
  const calendarDays = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Add day headers
  calendarDays.push(
    <div key="header" className="mb-2 grid grid-cols-7 gap-1">
      {dayNames.map((day) => (
        <div
          key={day}
          className="py-2 text-center text-sm font-medium text-muted-foreground"
        >
          {day}
        </div>
      ))}
    </div>,
  );

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(
      <div
        key={`empty-${i}`}
        className="h-24 rounded-lg border border-border"
      />,
    );
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const dayEvents = getEventsForDate(date);

    calendarDays.push(
      <div
        key={day}
        className={`h-24 cursor-pointer rounded-lg border border-border p-1 transition-colors ${
          isToday(date) ? "border-primary bg-primary/10" : ""
        } ${isSelected(date) ? "ring-2 ring-primary" : ""} hover:bg-muted/50`}
        onClick={() => onDateSelect(date)}
      >
        <div className="mb-1 text-sm font-medium">{day}</div>
        <div className="space-y-1 overflow-hidden">
          {dayEvents.slice(0, 2).map((event, index) => (
            <div
              key={index}
              className="truncate rounded bg-primary/20 p-1 text-xs text-primary-foreground"
              title={`${formatTime(event.startTime)} - ${event.title}`}
            >
              <div className="truncate font-medium">{event.title}</div>
              <div className="text-xs opacity-75">
                {formatTime(event.startTime)}
              </div>
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-center text-xs text-muted-foreground">
              +{dayEvents.length - 2} more
            </div>
          )}
        </div>
      </div>,
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {currentMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">{calendarDays}</div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="mt-4 rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-2 font-medium">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <div className="space-y-2">
            {getEventsForDate(selectedDate).length > 0 ? (
              getEventsForDate(selectedDate).map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded border bg-background p-2"
                >
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(event.startTime)} -{" "}
                      {formatTime(event.endTime)}
                    </div>
                    {event.location && (
                      <div className="text-sm text-muted-foreground">
                        {event.location}
                      </div>
                    )}
                  </div>
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: event.calendarColor || "#3b82f6",
                    }}
                  />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                No events scheduled for this date
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
