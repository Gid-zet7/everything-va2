import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import Account from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { getEmailDetails } from "@/lib/aurinko";
import type { Prisma } from "@prisma/client";
import { emailAddressSchema } from "@/lib/types";
import { FREE_CREDITS_PER_DAY } from "@/app/constants";
import { EmailOrganizer } from "@/lib/email-organizer";
import { checkAccountAuthStatus } from "@/lib/account-utils";

export const authoriseAccountAccess = async (
  accountId: string,
  userId: string,
) => {
  try {
    const account = await db.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
      },
      select: {
        id: true,
        emailAddress: true,
        name: true,
        token: true,
      },
    });
    if (!account) {
      console.log(
        `No account found for accountId: ${accountId}, userId: ${userId}`,
      );
      throw new Error(
        "Account not found. Please connect your email account first.",
      );
    }
    return account;
  } catch (error) {
    console.error("Error in authoriseAccountAccess:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to access account");
  }
};

const inboxFilter = (accountId: string): Prisma.ThreadWhereInput => ({
  accountId,
  inboxStatus: true,
});

const sentFilter = (accountId: string): Prisma.ThreadWhereInput => ({
  accountId,
  sentStatus: true,
});

const draftFilter = (accountId: string): Prisma.ThreadWhereInput => ({
  accountId,
  draftStatus: true,
});

export const mailRouter = createTRPCRouter({
  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log("getAccounts called with userId:", ctx.auth.id);
      const accounts = await ctx.db.account.findMany({
        where: {
          userId: ctx.auth.id,
        },
        select: {
          id: true,
          emailAddress: true,
          name: true,
        },
      });
      console.log("getAccounts result:", accounts);
      return accounts;
    } catch (error) {
      console.error("Error in getAccounts:", error);
      // Return empty array if there's a database error
      return [];
    }
  }),
  getNumThreads: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        tab: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );
      let filter: Prisma.ThreadWhereInput = {};
      if (input.tab === "inbox") {
        filter = inboxFilter(account.id);
      } else if (input.tab === "sent") {
        filter = sentFilter(account.id);
      } else if (input.tab === "drafts") {
        filter = draftFilter(account.id);
      }
      return await ctx.db.thread.count({
        where: filter,
      });
    }),
  getThreads: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        tab: z.string(),
        done: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );

      let filter: Prisma.ThreadWhereInput = {};
      if (input.tab === "inbox") {
        filter = inboxFilter(account.id);
      } else if (input.tab === "sent") {
        filter = sentFilter(account.id);
      } else if (input.tab === "drafts") {
        filter = draftFilter(account.id);
      }

      filter.done = {
        equals: input.done,
      };

      const threads = await ctx.db.thread.findMany({
        where: filter,
        include: {
          emails: {
            orderBy: {
              sentAt: "asc",
            },
            select: {
              from: true,
              body: true,
              bodySnippet: true,
              emailLabel: true,
              subject: true,
              sysLabels: true,
              id: true,
              sentAt: true,
            },
          },
        },
        take: 15,
        orderBy: {
          lastMessageDate: "desc",
        },
      });
      return threads;
    }),

  getThreadById: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        threadId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );
      return await ctx.db.thread.findUnique({
        where: { id: input.threadId },
        include: {
          emails: {
            orderBy: {
              sentAt: "asc",
            },
            select: {
              from: true,
              body: true,
              subject: true,
              bodySnippet: true,
              emailLabel: true,
              sysLabels: true,
              id: true,
              sentAt: true,
            },
          },
        },
      });
    }),

  getReplyDetails: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        threadId: z.string(),
        replyType: z.enum(["reply", "replyAll"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );

      const thread = await ctx.db.thread.findUnique({
        where: { id: input.threadId },
        include: {
          emails: {
            orderBy: { sentAt: "asc" },
            select: {
              from: true,
              to: true,
              cc: true,
              bcc: true,
              sentAt: true,
              subject: true,
              internetMessageId: true,
            },
          },
        },
      });

      if (!thread || thread.emails.length === 0) {
        throw new Error("Thread not found or empty");
      }

      const lastExternalEmail = thread.emails
        .reverse()
        .find((email) => email.from.id !== account.id);

      if (!lastExternalEmail) {
        throw new Error("No external email found in thread");
      }

      const allRecipients = new Set([
        ...thread.emails.flatMap((e) => [e.from, ...e.to, ...e.cc]),
      ]);

      if (input.replyType === "reply") {
        return {
          to: [lastExternalEmail.from],
          cc: [],
          from: { name: account.name, address: account.emailAddress },
          subject: `${lastExternalEmail.subject}`,
          id: lastExternalEmail.internetMessageId,
        };
      } else if (input.replyType === "replyAll") {
        return {
          to: [
            lastExternalEmail.from,
            ...lastExternalEmail.to.filter((addr) => addr.id !== account.id),
          ],
          cc: lastExternalEmail.cc.filter((addr) => addr.id !== account.id),
          from: { name: account.name, address: account.emailAddress },
          subject: `${lastExternalEmail.subject}`,
          id: lastExternalEmail.internetMessageId,
        };
      }
    }),

  syncEmails: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );
      if (!account) throw new Error("Invalid token");

      try {
        const acc = new Account(account.token, input.accountId);
        await acc.syncEmails();
        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message === "TOKEN_EXPIRED") {
          throw new Error("TOKEN_EXPIRED");
        }
        console.error("Sync emails error:", error);
        throw new Error("Failed to sync emails");
      }
    }),
  checkAccountAuth: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await checkAccountAuthStatus(input.accountId);
    }),
  setUndone: protectedProcedure
    .input(
      z.object({
        threadId: z.string().optional(),
        threadIds: z.array(z.string()).optional(),
        accountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );
      if (!account) throw new Error("Invalid token");
      if (input.threadId) {
        await ctx.db.thread.update({
          where: {
            id: input.threadId,
          },
          data: {
            done: false,
          },
        });
      }
      if (input.threadIds) {
        await ctx.db.thread.updateMany({
          where: {
            id: {
              in: input.threadIds,
            },
          },
          data: {
            done: false,
          },
        });
      }
    }),
  setDone: protectedProcedure
    .input(
      z.object({
        threadId: z.string().optional(),
        threadIds: z.array(z.string()).optional(),
        accountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.threadId && !input.threadIds)
        throw new Error("No threadId or threadIds provided");
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );
      if (!account) throw new Error("Invalid token");
      if (input.threadId) {
        await ctx.db.thread.update({
          where: {
            id: input.threadId,
          },
          data: {
            done: true,
          },
        });
      }
      if (input.threadIds) {
        await ctx.db.thread.updateMany({
          where: {
            id: {
              in: input.threadIds,
            },
          },
          data: {
            done: true,
          },
        });
      }
    }),
  getEmailDetails: protectedProcedure
    .input(
      z.object({
        emailId: z.string(),
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );
      return await getEmailDetails(account.token, input.emailId);
    }),
  sendEmail: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        body: z.string(),
        subject: z.string(),
        from: emailAddressSchema,
        to: z.array(emailAddressSchema),
        cc: z.array(emailAddressSchema).optional(),
        bcc: z.array(emailAddressSchema).optional(),
        replyTo: emailAddressSchema,
        inReplyTo: z.string().optional(),
        threadId: z.string().optional(),
        attachments: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              size: z.number(),
              type: z.string(),
              content: z.string(), // base64 encoded content
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const acc = await authoriseAccountAccess(input.accountId, ctx.auth.id);
      const account = new Account(acc.token);
      console.log("sendmail", input);
      await account.sendEmail({
        body: input.body,
        subject: input.subject,
        threadId: input.threadId,
        to: input.to,
        bcc: input.bcc,
        cc: input.cc,
        replyTo: input.replyTo,
        from: input.from,
        inReplyTo: input.inReplyTo,
        attachments: input.attachments,
      });
    }),
  getEmailSuggestions: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        query: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );
      return await ctx.db.emailAddress.findMany({
        where: {
          accountId: input.accountId,
          OR: [
            {
              address: {
                contains: input.query,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: input.query,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          address: true,
          name: true,
        },
        take: 10,
      });
    }),
  getMyAccount: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );
      return account;
    }),
  getChatbotInteraction: protectedProcedure.query(async ({ ctx }) => {
    const chatbotInteraction = await ctx.db.chatbotInteraction.findUnique({
      where: {
        day: new Date().toDateString(),
        userId: ctx.auth.id,
      },
      select: { count: true },
    });
    const remainingCredits =
      FREE_CREDITS_PER_DAY - (chatbotInteraction?.count || 0);
    return {
      remainingCredits,
    };
  }),

  // Email Organization Endpoints
  organizeEmails: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        autoClassify: z.boolean().optional(),
        createCategories: z.boolean().optional(),
        applyRules: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );

      return await EmailOrganizer.organizeEmails({
        userId: ctx.auth.id,
        accountId: account.id,
        autoClassify: input.autoClassify,
        createCategories: input.createCategories,
        applyRules: input.applyRules,
      });
    }),

  getOrganizedEmails: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        category: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        status: z
          .enum(["unread", "read", "archived", "flagged", "snoozed"])
          .optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );

      return await EmailOrganizer.getOrganizedEmails(ctx.auth.id, account.id, {
        category: input.category,
        priority: input.priority,
        status: input.status,
        search: input.search,
      });
    }),

  getEmailCategories: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );

      return await ctx.db.emailCategory.findMany({
        where: {
          userId: ctx.auth.id,
        },
        orderBy: {
          name: "asc",
        },
      });
    }),

  getEmailStats: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );

      return await EmailOrganizer.getEmailStats(ctx.auth.id, account.id);
    }),

  createEmailRule: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        conditions: z.array(
          z.object({
            field: z.string(),
            operator: z.string(),
            value: z.any(),
          }),
        ),
        actions: z.array(
          z.object({
            type: z.string(),
            value: z.any(),
          }),
        ),
        priority: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );

      return await ctx.db.emailRule.create({
        data: {
          userId: ctx.auth.id,
          name: input.name,
          description: input.description,
          conditions: input.conditions,
          actions: input.actions,
          priority: input.priority || 0,
        },
      });
    }),

  getEmailRules: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );

      return await ctx.db.emailRule.findMany({
        where: {
          userId: ctx.auth.id,
        },
        orderBy: {
          priority: "desc",
        },
      });
    }),

  updateEmailOrganization: protectedProcedure
    .input(
      z.object({
        emailId: z.string(),
        accountId: z.string(),
        categoryId: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        status: z
          .enum(["unread", "read", "archived", "flagged", "snoozed"])
          .optional(),
        customLabels: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );

      // Verify the email belongs to this account
      const email = await ctx.db.email.findFirst({
        where: {
          id: input.emailId,
          thread: {
            accountId: account.id,
          },
        },
      });

      if (!email) {
        throw new Error("Email not found or access denied");
      }

      // Update the email
      const updateData: any = {};

      if (input.categoryId !== undefined) {
        updateData.categoryId = input.categoryId || null;
      }

      if (input.priority !== undefined) {
        updateData.priority = input.priority;
      }

      if (input.status !== undefined) {
        updateData.status = input.status;
      }

      if (input.customLabels !== undefined) {
        updateData.customLabels = input.customLabels;
      }

      // Update or create email notes
      if (input.notes !== undefined) {
        // You might want to create a separate EmailNotes table for this
        // For now, we'll store it in a custom field or use the existing structure
        updateData.notes = input.notes;
      }

      return await ctx.db.email.update({
        where: { id: input.emailId },
        data: updateData,
      });
    }),

  bulkUpdateEmails: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        emailIds: z.array(z.string()),
        categoryId: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        status: z
          .enum(["unread", "read", "archived", "flagged", "snoozed"])
          .optional(),
        customLabels: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.id,
      );

      // Verify all emails belong to this account
      const emails = await ctx.db.email.findMany({
        where: {
          id: { in: input.emailIds },
          thread: {
            accountId: account.id,
          },
        },
      });

      if (emails.length !== input.emailIds.length) {
        throw new Error("Some emails not found or access denied");
      }

      // Prepare update data
      const updateData: any = {};

      if (input.categoryId !== undefined) {
        updateData.categoryId = input.categoryId || null;
      }

      if (input.priority !== undefined) {
        updateData.priority = input.priority;
      }

      if (input.status !== undefined) {
        updateData.status = input.status;
      }

      if (input.customLabels !== undefined) {
        updateData.customLabels = input.customLabels;
      }

      // Bulk update emails
      const result = await ctx.db.email.updateMany({
        where: {
          id: { in: input.emailIds },
          thread: {
            accountId: account.id,
          },
        },
        data: updateData,
      });

      return { updatedCount: result.count };
    }),
});
