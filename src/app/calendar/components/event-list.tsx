"use client";

import { Clock, MapPin, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventListProps {
  events: any[];
  isLoading: boolean;
}

export function EventList({ events, isLoading }: EventListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getTimeUntilEvent = (dateString: string) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    const diffInMs = eventDate.getTime() - now.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMs < 0) {
      return "Past";
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} away`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} away`;
    } else {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} away`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 rounded-lg bg-muted"></div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="mb-2 text-muted-foreground">No upcoming events</p>
        <p className="text-sm text-muted-foreground">
          Create your first event to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.slice(0, 5).map((event, index) => (
        <div
          key={index}
          className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <div
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: event.calendarColor || "#3b82f6" }}
                />
                <h4 className="truncate font-medium">{event.title}</h4>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(event.startTime)}</span>
                  {!event.isAllDay && (
                    <>
                      <span>-</span>
                      <span>{formatTime(event.endTime)}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(event.startTime)}</span>
                </div>
              </div>

              {event.location && (
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}

              {event.attendees && event.attendees.length > 0 && (
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>
                    {event.attendees.length} attendee
                    {event.attendees.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="ml-2 text-right text-xs text-muted-foreground">
              <div>{getTimeUntilEvent(event.startTime)}</div>
              <div className="text-xs opacity-75">{event.calendarName}</div>
            </div>
          </div>
        </div>
      ))}

      {events.length > 5 && (
        <div className="pt-2 text-center">
          <Button variant="outline" size="sm">
            View all {events.length} events
          </Button>
        </div>
      )}
    </div>
  );
}
