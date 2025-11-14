"use client";

import { useState, useMemo, useEffect } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, RefreshCw, Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { CreateEventDialog } from "./components/create-event-dialog";
import { EventList } from "./components/event-list";
import { CalendarSwitcher } from "./components/calendar-switcher";
import { EventCalendar, type CalendarEvent } from "@/components";

export default function CalendarPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [accountId] = useLocalStorage("calendarAccountId", "");
  const [calendarId, setCalendarId] = useLocalStorage("calendarId", "all");

  // Migrate old empty string values to "all"
  useEffect(() => {
    if (calendarId === "") {
      setCalendarId("all");
    }
  }, [calendarId, setCalendarId]);

  // Get calendars for the selected account
  const {
    data: calendars,
    isLoading: calendarsLoading,
    refetch: refetchCalendars,
  } = api.calendar.getCalendarsByAccount.useQuery(
    { accountId: accountId || "" },
    { enabled: !!accountId }
  );
  console.log("calendars", calendars);

  // Fetch events for calendar display (90 days to cover month views)
  const {
    data: upcomingEvents,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = api.calendar.getUpcomingEvents.useQuery({ 
    days: 90, // Fetch 90 days ahead to cover month views
    includePast: true, // Include past events for calendar display
    accountId: accountId || undefined, // Filter by selected account
    calendarId: calendarId && calendarId !== "all" ? calendarId : undefined, // Filter by selected calendar, or show all if "all"
  }, {
    enabled: !!accountId, // Only fetch if account is selected
  });
  console.log("upcomingEvents", upcomingEvents);
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
    
    return upcomingEvents.map((event): CalendarEvent => {
      const eventAny = event as any;
      return {
        id: event.id,
        title: event.title,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        allDay: event.isAllDay,
        color: (eventAny.color || event.calendarColor || "sky") as any,
      };
    });
  }, [upcomingEvents]);

  const handleSyncCalendars = async () => {
    if (!accountId) {
      toast.error("Please select an account first");
      return;
    }

    syncCalendarsMutation.mutate({ accountId });
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
    // Use selected calendar, or fallback to primary/first calendar
    let selectedCalendar = calendars?.find(c => c.id === calendarId);
    
    // If no calendar selected or "All Calendars" is selected, use primary or first
    if (!selectedCalendar) {
      selectedCalendar = calendars?.find(c => c.isPrimary) || calendars?.[0];
    }

    if (!selectedCalendar) {
      toast.error("Please select a calendar first");
      return;
    }

    // If provider calendar present, create via provider API
    if (selectedCalendar.account?.id && selectedCalendar.aurinkoCalendarId) {
      createEventMutation.mutate({
        accountId: selectedCalendar.account.id,
        calendarId: selectedCalendar.aurinkoCalendarId,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.start.toISOString(),
        endTime: event.end.toISOString(),
        isAllDay: event.allDay || false,
      });
      return;
    }

    // Otherwise, create a DB event as a fallback
    if (createDbEventMutation) {
      createDbEventMutation.mutate({
        calendarId: selectedCalendar.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.start.toISOString(),
        endTime: event.end.toISOString(),
        isAllDay: event.allDay || false,
        color: event.color || undefined,
      });
    } else {
      toast.error("Could not determine a calendar to save the event.");
    }
  };

  const handleEventUpdate = (event: CalendarEvent) => {
    // Need the provider account/calendar context from the event list; find by id if present
    const src = (upcomingEvents as any[])?.find((e) => e.id === event.id);
    const selectedCalendar = calendars?.find(c => c.id === calendarId) || calendars?.[0];
    
    const eventAccountId = src?.accountId || selectedCalendar?.account?.id || accountId;
    const aurinkoCalendarId = src?.calendarId || selectedCalendar?.aurinkoCalendarId;
    
    if (!eventAccountId || !aurinkoCalendarId) {
      toast.error("Missing calendar context for update.");
      return;
    }
    updateEventMutation.mutate({
      accountId: eventAccountId,
      calendarId: aurinkoCalendarId,
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
    const selectedCalendar = calendars?.find(c => c.id === calendarId) || calendars?.[0];
    
    const eventAccountId = src?.accountId || selectedCalendar?.account?.id || accountId;
    const aurinkoCalendarId = src?.calendarId || selectedCalendar?.aurinkoCalendarId;
    
    if (!eventAccountId || !aurinkoCalendarId) {
      toast.error("Missing calendar context for delete.");
      return;
    }
    deleteEventMutation.mutate({
      accountId: eventAccountId,
      calendarId: aurinkoCalendarId,
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

      {/* Calendar Switcher */}
      <div className="flex items-center gap-4">
        <div className="w-full max-w-2xl">
          <CalendarSwitcher />
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
              {!accountId ? (
                <div className="py-8 text-center">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 text-muted-foreground">
                    No account selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Select an account to view calendars
                  </p>
                </div>
              ) : calendarsLoading ? (
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
