import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { 
  getCalendars, 
  getCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  syncCalendars 
} from "@/lib/calendar-utils";
import { db } from "@/server/db";

export const calendarRouter = createTRPCRouter({
  // Get user's calendars from database
  getUserCalendars: protectedProcedure
    .query(async ({ ctx }) => {
      const calendars = await db.calendar.findMany({
        where: {
          account: {
            userId: ctx.userId,
          },
        },
        include: {
          account: {
            select: {
              id: true,
              emailAddress: true,
              name: true,
            },
          },
        },
        orderBy: [
          { isPrimary: "desc" },
          { name: "asc" },
        ],
      });

      return calendars;
    }),

  // Sync calendars for an account
  syncCalendars: protectedProcedure
    .input(z.object({
      accountId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await syncCalendars(input.accountId);
        return { success: true };
      } catch (error) {
        console.error("Error syncing calendars:", error);
        throw new Error("Failed to sync calendars");
      }
    }),

  // Get events for a calendar
  getCalendarEvents: protectedProcedure
    .input(z.object({
      accountId: z.string(),
      calendarId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const events = await getCalendarEvents(
          input.accountId,
          input.calendarId,
          input.startDate,
          input.endDate
        );
        return events;
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        throw new Error("Failed to fetch calendar events");
      }
    }),

  // Create a new calendar event
  createEvent: protectedProcedure
    .input(z.object({
      accountId: z.string(),
      calendarId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.string(),
      endTime: z.string(),
      isAllDay: z.boolean().default(false),
      attendees: z.array(z.object({
        email: z.string(),
        name: z.string().optional(),
      })).optional(),
      recurrence: z.string().optional(),
      meetingUrl: z.string().optional(),
      reminders: z.array(z.object({
        method: z.string(),
        minutes: z.number(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const event = await createCalendarEvent(
          input.accountId,
          input.calendarId,
          {
            title: input.title,
            description: input.description,
            location: input.location,
            startTime: input.startTime,
            endTime: input.endTime,
            isAllDay: input.isAllDay,
            attendees: input.attendees,
            recurrence: input.recurrence,
            meetingUrl: input.meetingUrl,
            reminders: input.reminders,
          }
        );
        return event;
      } catch (error) {
        console.error("Error creating calendar event:", error);
        throw new Error("Failed to create calendar event");
      }
    }),

  // Update a calendar event
  updateEvent: protectedProcedure
    .input(z.object({
      accountId: z.string(),
      calendarId: z.string(),
      eventId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      isAllDay: z.boolean().optional(),
      attendees: z.array(z.object({
        email: z.string(),
        name: z.string().optional(),
      })).optional(),
      recurrence: z.string().optional(),
      meetingUrl: z.string().optional(),
      reminders: z.array(z.object({
        method: z.string(),
        minutes: z.number(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { accountId, calendarId, eventId, ...eventData } = input;
        const event = await updateCalendarEvent(
          accountId,
          calendarId,
          eventId,
          eventData
        );
        return event;
      } catch (error) {
        console.error("Error updating calendar event:", error);
        throw new Error("Failed to update calendar event");
      }
    }),

  // Delete a calendar event
  deleteEvent: protectedProcedure
    .input(z.object({
      accountId: z.string(),
      calendarId: z.string(),
      eventId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await deleteCalendarEvent(
          input.accountId,
          input.calendarId,
          input.eventId
        );
        return { success: true };
      } catch (error) {
        console.error("Error deleting calendar event:", error);
        throw new Error("Failed to delete calendar event");
      }
    }),

  // Get upcoming events across all user calendars
  getUpcomingEvents: protectedProcedure
    .input(z.object({
      days: z.number().default(7), // Number of days to look ahead
    }))
    .query(async ({ ctx, input }) => {
      try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + input.days);

        const userCalendars = await db.calendar.findMany({
          where: {
            account: {
              userId: ctx.userId,
            },
          },
          include: {
            account: {
              select: {
                id: true,
                emailAddress: true,
              },
            },
          },
        });

        const allEvents = [];

        for (const calendar of userCalendars) {
          try {
            const events = await getCalendarEvents(
              calendar.account.id,
              calendar.aurinkoCalendarId!,
              startDate.toISOString(),
              endDate.toISOString()
            );

            allEvents.push(
              ...events.map(event => ({
                ...event,
                calendarName: calendar.name,
                calendarColor: calendar.color,
                accountEmail: calendar.account.emailAddress,
              }))
            );
          } catch (error) {
            console.error(`Error fetching events for calendar ${calendar.id}:`, error);
            // Continue with other calendars even if one fails
          }
        }

        // Sort events by start time
        return allEvents.sort((a, b) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        throw new Error("Failed to fetch upcoming events");
      }
    }),
});

