import { db } from "@/server/db";
import { EmailClassifier, type EmailContent } from "./email-classifier";
import { EmailCategory, EmailPriority, EmailStatus } from "@prisma/client";

export interface EmailOrganizationOptions {
  userId: string;
  accountId: string;
  autoClassify?: boolean;
  createCategories?: boolean;
  applyRules?: boolean;
}

export class EmailOrganizer {
  static async organizeEmails(options: EmailOrganizationOptions) {
    const {
      userId,
      accountId,
      autoClassify = true,
      createCategories = true,
      applyRules = true,
    } = options;

    try {
      // Get all unorganized emails for this account
      const emails = await db.email.findMany({
        where: {
          thread: {
            accountId: accountId,
          },
          classification: null, // Only emails that haven't been classified yet
        },
        include: {
          from: true,
          to: true,
          cc: true,
          bcc: true,
          thread: true,
        },
        orderBy: {
          receivedAt: "desc",
        },
      });

      console.log(`Found ${emails.length} emails to organize`);

      // Create default categories if requested
      if (createCategories) {
        await this.createDefaultCategories(userId);
      }

      // Process each email
      for (const email of emails) {
        try {
          if (autoClassify) {
            await this.classifyEmail(email, userId);
          }

          if (applyRules) {
            await this.applyRules(email, userId);
          }
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error);
        }
      }

      return { success: true, processedCount: emails.length };
    } catch (error) {
      console.error("Error organizing emails:", error);
      throw error;
    }
  }

  static async classifyEmail(email: any, userId: string) {
    // Prepare email content for classification
    const emailContent: EmailContent = {
      subject: email.subject || "",
      body: email.body || email.bodySnippet || "",
      from: email.from.address,
      to: email.to.map((addr: any) => addr.address),
      cc: email.cc?.map((addr: any) => addr.address) || [],
      bcc: email.bcc?.map((addr: any) => addr.address) || [],
      receivedAt: email.receivedAt,
    };

    // Classify the email
    const classification = await EmailClassifier.classifyEmail(emailContent);

    // Save classification to database
    await db.emailClassification.create({
      data: {
        emailId: email.id,
        category: classification.category,
        priority: classification.priority,
        confidence: classification.confidence,
        entities: classification.entities,
        sentiment: classification.sentiment,
        keywords: classification.keywords,
        hasActionItems: classification.hasActionItems,
        actionItems: classification.actionItems,
        dueDate: classification.dueDate,
        requiresResponse: classification.requiresResponse,
        isMeeting: classification.isMeeting,
        meetingDate: classification.meetingDate,
        meetingDuration: classification.meetingDuration,
        clientName: classification.clientName,
        projectName: classification.projectName,
      },
    });

    // Update email with category and priority
    await db.email.update({
      where: { id: email.id },
      data: {
        categoryId: await this.getOrCreateCategoryId(
          classification.category,
          userId,
        ),
        priority: classification.priority,
        status:
          classification.priority === EmailPriority.urgent
            ? EmailStatus.flagged
            : EmailStatus.unread,
      },
    });

    console.log(
      `Classified email ${email.id} as ${classification.category} with ${classification.confidence} confidence`,
    );
  }

  static async applyRules(email: any, userId: string) {
    // Get active rules for this user
    const rules = await db.emailRule.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    for (const rule of rules) {
      if (await this.matchesRule(email, rule)) {
        await this.applyRule(email, rule);
        break; // Apply only the first matching rule
      }
    }
  }

  private static async matchesRule(email: any, rule: any): Promise<boolean> {
    const conditions = rule.conditions as any[];

    for (const condition of conditions) {
      const { field, operator, value } = condition;

      let emailValue: any;
      switch (field) {
        case "subject":
          emailValue = email.subject;
          break;
        case "from":
          emailValue = email.from.address;
          break;
        case "to":
          emailValue = email.to.map((addr: any) => addr.address);
          break;
        case "body":
          emailValue = email.body || email.bodySnippet;
          break;
        case "hasAttachments":
          emailValue = email.hasAttachments;
          break;
        default:
          continue;
      }

      if (!this.evaluateCondition(emailValue, operator, value)) {
        return false;
      }
    }

    return true;
  }

  private static evaluateCondition(
    value: any,
    operator: string,
    expectedValue: any,
  ): boolean {
    switch (operator) {
      case "equals":
        return value === expectedValue;
      case "contains":
        if (Array.isArray(value)) {
          return value.some((v: any) =>
            v.toLowerCase().includes(expectedValue.toLowerCase()),
          );
        }
        return value.toLowerCase().includes(expectedValue.toLowerCase());
      case "startsWith":
        return value.toLowerCase().startsWith(expectedValue.toLowerCase());
      case "endsWith":
        return value.toLowerCase().endsWith(expectedValue.toLowerCase());
      case "regex":
        return new RegExp(expectedValue, "i").test(value);
      case "in":
        return Array.isArray(expectedValue)
          ? expectedValue.includes(value)
          : false;
      case "not":
        return value !== expectedValue;
      default:
        return false;
    }
  }

  private static async applyRule(email: any, rule: any) {
    const actions = rule.actions as any[];

    for (const action of actions) {
      const { type, value } = action;

      switch (type) {
        case "categorize":
          const categoryId = await this.getOrCreateCategoryId(
            value,
            email.thread.account.userId,
          );
          await db.email.update({
            where: { id: email.id },
            data: { categoryId },
          });
          break;

        case "setPriority":
          await db.email.update({
            where: { id: email.id },
            data: { priority: value },
          });
          break;

        case "setStatus":
          await db.email.update({
            where: { id: email.id },
            data: { status: value },
          });
          break;

        case "addLabel":
          await db.email.update({
            where: { id: email.id },
            data: {
              customLabels: {
                push: value,
              },
            },
          });
          break;
      }
    }
  }

  private static async createDefaultCategories(userId: string) {
    const defaultCategories = [
      {
        name: "Action Required",
        description: "Emails you must respond to or handle soon",
        color: "#ef4444",
        icon: "alert-circle",
      },
      {
        name: "Waiting On",
        description: "Emails where you're waiting for someone else's reply",
        color: "#f59e0b",
        icon: "clock",
      },
      {
        name: "Reference / Archive",
        description: "Emails you don't need to act on but may need later",
        color: "#6b7280",
        icon: "archive",
      },
      {
        name: "Someday / Later",
        description: "Low-priority emails to review eventually",
        color: "#8b5cf6",
        icon: "calendar",
      },
      {
        name: "Clients",
        description: "One per client",
        color: "#3b82f6",
        icon: "users",
      },
      {
        name: "Projects",
        description: "One per major project or initiative",
        color: "#10b981",
        icon: "folder",
      },
      {
        name: "Finance",
        description: "Invoices, receipts, payroll, taxes",
        color: "#059669",
        icon: "dollar-sign",
      },
      {
        name: "Meetings",
        description: "Invitations, agendas, minutes",
        color: "#7c3aed",
        icon: "video",
      },
    ];

    for (const category of defaultCategories) {
      await db.emailCategory.upsert({
        where: {
          userId_name: {
            userId,
            name: category.name,
          },
        },
        update: {},
        create: {
          userId,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
        },
      });
    }
  }

  private static async getOrCreateCategoryId(
    categoryName: string,
    userId: string,
  ): Promise<string> {
    // Map enum values to display names
    const categoryMap: Record<string, string> = {
      actionRequired: "Action Required",
      waitingOn: "Waiting On",
      reference: "Reference / Archive",
      somedayLater: "Someday / Later",
      clients: "Clients",
      projects: "Projects",
      finance: "Finance",
      meetings: "Meetings",
      personal: "Personal",
      spam: "Spam",
    };

    const displayName = categoryMap[categoryName] || categoryName;

    const category = await db.emailCategory.upsert({
      where: {
        userId_name: {
          userId,
          name: displayName,
        },
      },
      update: {},
      create: {
        userId,
        name: displayName,
        description: `Auto-created category for ${displayName}`,
      },
    });

    return category.id;
  }

  static async getOrganizedEmails(
    userId: string,
    accountId: string,
    filters?: {
      category?: string;
      priority?: EmailPriority;
      status?: EmailStatus;
      search?: string;
    },
  ) {
    const where: any = {
      thread: {
        accountId,
        account: {
          userId,
        },
      },
    };

    if (filters?.category) {
      where.categoryId = filters.category;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: "insensitive" } },
        { body: { contains: filters.search, mode: "insensitive" } },
        { bodySnippet: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return await db.email.findMany({
      where,
      include: {
        from: true,
        to: true,
        cc: true,
        bcc: true,
        thread: true,
        category: true,
        classification: true,
        attachments: true,
      },
      orderBy: [{ priority: "desc" }, { receivedAt: "desc" }],
    });
  }

  static async getEmailStats(userId: string, accountId: string) {
    const stats = await db.email.groupBy({
      by: ["categoryId", "priority", "status"],
      where: {
        thread: {
          accountId,
          account: {
            userId,
          },
        },
      },
      _count: {
        id: true,
      },
    });

    return stats;
  }
}
