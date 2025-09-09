"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, RefreshCw, Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { CreateEventDialog } from "./components/create-event-dialog";
import { CalendarView } from "./components/calendar-view";
import { EventList } from "./components/event-list";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    data: calendars,
    isLoading: calendarsLoading,
    refetch: refetchCalendars,
  } = api.calendar.getUserCalendars.useQuery();
  const {
    data: upcomingEvents,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = api.calendar.getUpcomingEvents.useQuery({ days: 7 });

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
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarView
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                calendars={calendars || []}
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
        selectedDate={selectedDate}
        onEventCreated={() => {
          refetchEvents();
          setIsCreateDialogOpen(false);
        }}
      />
    </div>
  );
}
