"use client";

import { useState, useMemo } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, RefreshCw, Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { CreateEventDialog } from "./components/create-event-dialog";
import { EventList } from "./components/event-list";
import { EventCalendar, type CalendarEvent } from "@/components";

export default function CalendarPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    data: calendars,
    isLoading: calendarsLoading,
    refetch: refetchCalendars,
  } = api.calendar.getUserCalendars.useQuery();

  // Use upstream provider events instead of DB (no Calendar table required)
  const {
    data: upcomingEvents,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = api.calendar.getUpcomingEvents.useQuery({ days: 30 });

  const syncCalendarsMutation = api.calendar.syncCalendars.useMutation({
    onSuccess: () => {
      toast.success("Calendars synced successfully");
      refetchCalendars();
      refetchEvents();
    },
    onError: (error) => {
      toast.error(`Failed to sync calendars: ${error.message}`);
    },
  });

  // Use provider-backed create/update/delete
  const createEventMutation = api.calendar.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully");
      refetchEvents();
    },
    onError: (error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });

  const updateEventMutation = api.calendar.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("Event updated successfully");
      refetchEvents();
    },
    onError: (error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });

  const deleteEventMutation = api.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("Event deleted successfully");
      refetchEvents();
    },
    onError: (error) => {
      toast.error(`Failed to delete event: ${error.message}`);
    },
  });

  // Fallback: create calendar locally and create DB event when provider calendar isn't available
  const createCalendarMutation = api.calendar.createCalendar.useMutation({
    onSuccess: () => {
      toast.success("Calendar created");
      refetchCalendars();
    },
    onError: (error) => {
      toast.error(`Failed to create calendar: ${error.message}`);
    },
  });

  const createDbEventMutation = api.calendar.createDbEvent?.useMutation
    ? api.calendar.createDbEvent.useMutation({
        onSuccess: () => {
          toast.success("Event created (local)");
          refetchEvents();
        },
        onError: (error) => {
          toast.error(`Failed to create event (local): ${error.message}`);
        },
      })
    : (undefined as any);

  // Convert API events to EventCalendar format
  const calendarEvents = useMemo(() => {
    if (!upcomingEvents) return [];
    
    return upcomingEvents.map((event): CalendarEvent => ({
      id: event.id,
      title: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: new Date(event.startTime),
      end: new Date(event.endTime),
      allDay: event.isAllDay,
      color: (event.color as any) || "sky",
    }));
  }, [upcomingEvents]);

  const handleSyncCalendars = async () => {
    if (!calendars || calendars.length === 0) {
      toast.error("No calendars found to sync");
      return;
    }

    // Sync the first account's calendars (you might want to sync all accounts)
    const firstCalendar = calendars[0];
    if (firstCalendar?.account?.id) {
      syncCalendarsMutation.mutate({ accountId: firstCalendar.account.id });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleEventAdd = async (event: CalendarEvent) => {
    const first = calendars?.[0];

    // If provider calendar present, create via provider API
    if (first?.account?.id && first?.aurinkoCalendarId) {
      createEventMutation.mutate({
        accountId: first.account.id,
        calendarId: first.aurinkoCalendarId,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.start.toISOString(),
        endTime: event.end.toISOString(),
        isAllDay: event.allDay || false,
      });
      return;
    }

    // Otherwise, ensure a local calendar exists and create a DB event as a fallback
    let targetCalendarId = first?.id;
    if (!targetCalendarId) {
      const res = await createCalendarMutation.mutateAsync({ name: "My Calendar", isPrimary: true });
      targetCalendarId = (res as any)?.id;
      await refetchCalendars();
    }

    if (targetCalendarId && createDbEventMutation) {
      createDbEventMutation.mutate({
        calendarId: targetCalendarId,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.start.toISOString(),
        endTime: event.end.toISOString(),
        isAllDay: event.allDay || false,
      });
    } else {
      toast.error("Could not determine a calendar to save the event.");
    }
  };

  const handleEventUpdate = (event: CalendarEvent) => {
    // Need the provider account/calendar context from the event list; find by id if present
    const src = (upcomingEvents as any[])?.find((e) => e.id === event.id);
    const accountId = src?.accountId || calendars?.[0]?.account?.id;
    const calendarId = src?.calendarId || calendars?.[0]?.aurinkoCalendarId;
    if (!accountId || !calendarId) {
      toast.error("Missing calendar context for update.");
      return;
    }
    updateEventMutation.mutate({
      accountId,
      calendarId,
      eventId: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.start.toISOString(),
      endTime: event.end.toISOString(),
      isAllDay: event.allDay || false,
    });
  };

  const handleEventDelete = (eventId: string) => {
    const src = (upcomingEvents as any[])?.find((e) => e.id === eventId);
    const accountId = src?.accountId || calendars?.[0]?.account?.id;
    const calendarId = src?.calendarId || calendars?.[0]?.aurinkoCalendarId;
    if (!accountId || !calendarId) {
      toast.error("Missing calendar context for delete.");
      return;
    }
    deleteEventMutation.mutate({
      accountId,
      calendarId,
      eventId,
    });
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your events and schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncCalendars}
            disabled={syncCalendarsMutation.isPending || calendarsLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncCalendarsMutation.isPending ? "animate-spin" : ""}`}
            />
            Sync Calendars
          </Button>
          {/* <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventCalendar
                events={calendarEvents}
                onEventAdd={handleEventAdd}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
              />
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventList
                events={upcomingEvents || []}
                isLoading={eventsLoading}
              />
            </CardContent>
          </Card>

          {/* Connected Calendars */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Connected Calendars
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calendarsLoading ? (
                <div className="py-4 text-center">
                  <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Loading calendars...
                  </p>
                </div>
              ) : calendars && calendars.length > 0 ? (
                <div className="space-y-3">
                  {calendars.map((calendar) => (
                    <div
                      key={calendar.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{
                            backgroundColor: calendar.color || "#3b82f6",
                          }}
                        />
                        <div>
                          <p className="font-medium">{calendar.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {calendar.account.emailAddress}
                          </p>
                        </div>
                      </div>
                      {calendar.isPrimary && (
                        <span className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 text-muted-foreground">
                    No calendars connected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Connect your email account to sync calendars
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        calendars={calendars || []}
        selectedDate={new Date()}
        onEventCreated={() => {
          refetchEvents();
          setIsCreateDialogOpen(false);
        }}
      />
    </div>
  );
}
