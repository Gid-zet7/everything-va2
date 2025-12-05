import { db } from "@/server/db";
import { EmailClassifier, type EmailContent } from "./email-classifier";
import { EmailCategory, EmailPriority, EmailStatus } from "@prisma/client";

export interface EmailOrganizationOptions {
  userId: string;
  accountId: string;
  autoClassify?: boolean;
  createCategories?: boolean;
  applyRules?: boolean;
  reorganize?: boolean; // If true, re-organize already classified emails
}

export class EmailOrganizer {
  static async organizeEmails(options: EmailOrganizationOptions) {
    const {
      userId,
      accountId,
      autoClassify = true,
      createCategories = true,
      applyRules = true,
      reorganize = false, // Default to false to only organize unorganized emails
    } = options;

    try {
      // Build the where clause based on reorganize option
      const whereClause: any = {
        thread: {
          accountId: accountId,
        },
      };

      // Only filter out classified emails if reorganize is false
      if (!reorganize) {
        whereClause.classification = null; // Only emails that haven't been classified yet
      }

      // Get emails for this account
      const emails = await db.email.findMany({
        where: whereClause,
        include: {
          from: true,
          to: true,
          cc: true,
          bcc: true,
          thread: {
            include: {
              account: true, // Include account for rule application
            },
          },
          classification: true, // Include existing classification
        },
        orderBy: {
          receivedAt: "desc",
        },
      });

      console.log(`Found ${emails.length} email${emails.length !== 1 ? "s" : ""} to ${reorganize ? "re-organize" : "organize"}`);

      // Create default categories if requested
      if (createCategories) {
        await this.createDefaultCategories(userId);
      }

      // Process each email
      for (const email of emails) {
        try {
          let ruleApplied = false;

          // Apply rules FIRST - they should override classification
          if (applyRules) {
            ruleApplied = await this.applyRules(email, userId);
          }

          // Only classify if no rule was applied (rules take precedence)
          if (autoClassify && !ruleApplied) {
            await this.classifyEmail(email, userId);
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

    // Check if classification already exists
    const existingClassification = await db.emailClassification.findUnique({
      where: { emailId: email.id },
    });

    // Update or create classification
    if (existingClassification) {
      await db.emailClassification.update({
        where: { emailId: email.id },
        data: {
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
    } else {
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
    }

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

  static async applyRules(email: any, userId: string): Promise<boolean> {
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
        await this.applyRule(email, rule, userId);
        return true; // Return true to indicate a rule was applied
      }
    }
    
    return false; // No rule matched
  }

  private static async matchesRule(email: any, rule: any): Promise<boolean> {
    const conditions = rule.conditions as any[];
    
    if (!conditions || conditions.length === 0) {
      return false; // Rule must have at least one condition
    }

    for (const condition of conditions) {
      const { field, operator, value } = condition;

      let emailValue: any;
      switch (field) {
        case "subject":
          emailValue = email.subject || "";
          break;
        case "from":
          emailValue = email.from?.address || "";
          break;
        case "to":
          emailValue = (email.to || []).map((addr: any) => addr?.address || "");
          break;
        case "body":
          emailValue = email.body || email.bodySnippet || "";
          break;
        case "hasAttachments":
          emailValue = email.hasAttachments || false;
          break;
        default:
          continue;
      }

      // Skip if emailValue is null/undefined and we're doing a comparison
      if (emailValue === null || emailValue === undefined) {
        if (operator !== "not" && operator !== "equals") {
          return false;
        }
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
    // Handle null/undefined values
    if (value === null || value === undefined) {
      if (operator === "not" || operator === "equals") {
        return value === expectedValue;
      }
      return false;
    }

    switch (operator) {
      case "equals":
        if (typeof value === "string" && typeof expectedValue === "string") {
          return value.toLowerCase() === expectedValue.toLowerCase();
        }
        return value === expectedValue;
      case "contains":
        if (Array.isArray(value)) {
          const expectedLower = String(expectedValue).toLowerCase();
          return value.some((v: any) =>
            String(v || "").toLowerCase().includes(expectedLower),
          );
        }
        const valStr = String(value || "").toLowerCase();
        const expectedStr = String(expectedValue || "").toLowerCase();
        return valStr.includes(expectedStr);
      case "startsWith":
        return String(value || "").toLowerCase().startsWith(
          String(expectedValue || "").toLowerCase()
        );
      case "endsWith":
        return String(value || "").toLowerCase().endsWith(
          String(expectedValue || "").toLowerCase()
        );
      case "regex":
        try {
          return new RegExp(expectedValue, "i").test(String(value || ""));
        } catch {
          return false;
        }
      case "in":
        if (Array.isArray(expectedValue)) {
          return expectedValue.map(v => String(v).toLowerCase()).includes(
            String(value).toLowerCase()
          );
        }
        return false;
      case "not":
        if (typeof value === "string" && typeof expectedValue === "string") {
          return value.toLowerCase() !== expectedValue.toLowerCase();
        }
        return value !== expectedValue;
      default:
        return false;
    }
  }

  private static async applyRule(email: any, rule: any, userId: string) {
    const actions = rule.actions as any[];
    const updateData: any = {};

    for (const action of actions) {
      const { type, value } = action;

      switch (type) {
        case "categorize":
          // Handle both category name and categoryId
          let categoryId: string;
          if (typeof value === "string" && value.trim() !== "") {
            // If it's a category name, get or create the category
            categoryId = await this.getOrCreateCategoryId(value, userId);
          } else if (value) {
            categoryId = value;
          } else {
            continue; // Skip if invalid value
          }
          updateData.categoryId = categoryId;
          break;

        case "setPriority":
          updateData.priority = value;
          break;

        case "setStatus":
          updateData.status = value;
          break;

        case "addLabel":
          // Get existing labels and add new one if not present
          const currentLabels = email.customLabels || [];
          if (!currentLabels.includes(value)) {
            updateData.customLabels = [...currentLabels, value];
          }
          break;
      }
    }

    // Update email with all rule actions at once
    if (Object.keys(updateData).length > 0) {
      await db.email.update({
        where: { id: email.id },
        data: updateData,
      });
      
      console.log(
        `Applied rule "${rule.name}" to email ${email.id} with actions:`,
        Object.keys(updateData),
      );
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
    // First, verify the account belongs to the user and get email count
    const account = await db.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      console.error(`Account ${accountId} not found for user ${userId}`);
      return [];
    }

    // Get all thread IDs for this account first
    const threads = await db.thread.findMany({
      where: {
        accountId,
      },
      select: {
        id: true,
      },
    });

    const threadIds = threads.map(t => t.id);
    
    if (threadIds.length === 0) {
      console.log(`No threads found for account ${accountId}`);
      return [];
    }

    console.log(`Found ${threadIds.length} threads for account ${accountId}`);

    // Group by categoryId, priority, and status using threadIds
    // Note: categoryId can be null for uncategorized emails
    const stats = await db.email.groupBy({
      by: ["categoryId", "priority", "status"],
      where: {
        threadId: {
          in: threadIds,
        },
      },
      _count: {
        id: true,
      },
    });

    console.log(`Stats query returned ${stats.length} groups`);
    if (stats.length > 0) {
      console.log("Stats sample:", JSON.stringify(stats.slice(0, 5), null, 2));
    }

    return stats;
  }
}
