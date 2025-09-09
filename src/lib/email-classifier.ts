import { EmailCategoryType, EmailPriority } from "@prisma/client";

export interface ClassificationResult {
  category: EmailCategoryType;
  priority: EmailPriority;
  confidence: number;
  entities: {
    people: string[];
    companies: string[];
    dates: Date[];
    locations: string[];
  };
  sentiment: "positive" | "negative" | "neutral";
  keywords: string[];
  hasActionItems: boolean;
  actionItems: string[];
  dueDate?: Date;
  requiresResponse: boolean;
  isMeeting: boolean;
  meetingDate?: Date;
  meetingDuration?: number;
  clientName?: string;
  projectName?: string;
}

export interface EmailContent {
  subject: string;
  body: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  receivedAt: Date;
}

export class EmailClassifier {
  private static readonly ACTION_KEYWORDS = [
    "urgent",
    "asap",
    "deadline",
    "due",
    "required",
    "must",
    "need",
    "please",
    "request",
    "action",
    "respond",
    "reply",
    "confirm",
    "approve",
    "review",
    "sign",
    "complete",
    "submit",
    "send",
    "provide",
    "update",
    "schedule",
    "book",
    "reserve",
    "cancel",
  ];

  private static readonly MEETING_KEYWORDS = [
    "meeting",
    "call",
    "conference",
    "appointment",
    "schedule",
    "calendar",
    "invite",
    "zoom",
    "teams",
    "google meet",
    "webex",
    "skype",
    "discord",
    "slack call",
    "standup",
    "sync",
    "review",
    "discussion",
    "presentation",
    "demo",
  ];

  private static readonly FINANCE_KEYWORDS = [
    "invoice",
    "payment",
    "bill",
    "receipt",
    "expense",
    "budget",
    "cost",
    "price",
    "quote",
    "estimate",
    "tax",
    "payroll",
    "salary",
    "bonus",
    "refund",
    "credit",
    "debit",
    "transaction",
    "account",
    "balance",
    "statement",
    "financial",
  ];

  private static readonly CLIENT_KEYWORDS = [
    "client",
    "customer",
    "account",
    "project",
    "deliverable",
    "milestone",
    "scope",
    "requirements",
    "specifications",
    "feedback",
    "review",
    "approval",
  ];

  private static readonly WAITING_KEYWORDS = [
    "waiting",
    "pending",
    "awaiting",
    "following up",
    "check in",
    "status",
    "update",
    "response",
    "feedback",
    "approval",
    "confirmation",
    "when",
    "timeline",
    "schedule",
    "availability",
  ];

  static async classifyEmail(
    content: EmailContent,
  ): Promise<ClassificationResult> {
    const subject = content.subject.toLowerCase();
    const body = content.body.toLowerCase();
    const fullText = `${subject} ${body}`;

    // Extract entities
    const entities = this.extractEntities(fullText);

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(fullText);

    // Extract keywords
    const keywords = this.extractKeywords(fullText);

    // Check for action items
    const actionItems = this.extractActionItems(fullText);
    const hasActionItems = actionItems.length > 0;

    // Check for meetings
    const meetingInfo = this.extractMeetingInfo(fullText, content.receivedAt);

    // Determine category
    const category = this.determineCategory(
      content,
      keywords,
      actionItems,
      meetingInfo,
    );

    // Determine priority
    const priority = this.determinePriority(
      content,
      category,
      actionItems,
      keywords,
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(
      category,
      priority,
      keywords,
      actionItems,
    );

    // Extract client/project info
    const clientInfo = this.extractClientInfo(content, entities);

    // Check if response is required
    const requiresResponse = this.requiresResponse(
      content,
      actionItems,
      keywords,
    );

    return {
      category,
      priority,
      confidence,
      entities,
      sentiment,
      keywords,
      hasActionItems,
      actionItems,
      dueDate: this.extractDueDate(fullText),
      requiresResponse,
      isMeeting: meetingInfo.isMeeting,
      meetingDate: meetingInfo.date,
      meetingDuration: meetingInfo.duration,
      clientName: clientInfo.clientName,
      projectName: clientInfo.projectName,
    };
  }

  private static extractEntities(text: string) {
    const people: string[] = [];
    const companies: string[] = [];
    const dates: Date[] = [];
    const locations: string[] = [];

    // Simple entity extraction (in production, use a proper NLP library)
    const words = text.split(/\s+/);

    // Extract potential names (capitalized words)
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const names = text.match(namePattern) || [];
    people.push(...names);

    // Extract potential companies (words ending with Inc, Corp, LLC, etc.)
    const companyPattern =
      /\b[A-Z][a-zA-Z\s]*(?:Inc|Corp|LLC|Ltd|Company|Co)\b/g;
    const companiesFound = text.match(companyPattern) || [];
    companies.push(...companiesFound);

    // Extract dates
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/g,
    ];

    datePatterns.forEach((pattern) => {
      const matches = text.match(pattern) || [];
      matches.forEach((match) => {
        const date = new Date(match);
        if (!isNaN(date.getTime())) {
          dates.push(date);
        }
      });
    });

    return { people, companies, dates, locations };
  }

  private static analyzeSentiment(
    text: string,
  ): "positive" | "negative" | "neutral" {
    const positiveWords = [
      "great",
      "good",
      "excellent",
      "amazing",
      "wonderful",
      "perfect",
      "thanks",
      "thank you",
      "appreciate",
      "love",
      "happy",
      "excited",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "disappointed",
      "angry",
      "frustrated",
      "upset",
      "sorry",
      "apologize",
      "hate",
      "unhappy",
      "sad",
    ];

    const positiveCount = positiveWords.filter((word) =>
      text.includes(word),
    ).length;
    const negativeCount = negativeWords.filter((word) =>
      text.includes(word),
    ).length;

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  private static extractKeywords(text: string): string[] {
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
    ]);

    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    const wordCount = new Map<string, number>();
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private static extractActionItems(text: string): string[] {
    const actionItems: string[] = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach((sentence) => {
      const hasActionKeyword = this.ACTION_KEYWORDS.some((keyword) =>
        sentence.includes(keyword),
      );

      if (hasActionKeyword) {
        actionItems.push(sentence.trim());
      }
    });

    return actionItems;
  }

  private static extractMeetingInfo(text: string, receivedAt: Date) {
    const isMeeting = this.MEETING_KEYWORDS.some((keyword) =>
      text.includes(keyword),
    );

    if (!isMeeting) {
      return { isMeeting: false };
    }

    // Extract meeting date/time
    const timePatterns = [
      /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/gi,
      /\b(\d{1,2}):(\d{2})\b/g,
    ];

    let meetingDate: Date | undefined;
    let meetingDuration: number | undefined;

    // Look for duration patterns
    const durationPattern = /\b(\d+)\s*(hour|hr|minute|min)s?\b/gi;
    const durationMatch = text.match(durationPattern);
    if (durationMatch) {
      const match = durationMatch[0];
      const number = parseInt(match.match(/\d+/)?.[0] || "0");
      if (match.includes("hour") || match.includes("hr")) {
        meetingDuration = number * 60;
      } else {
        meetingDuration = number;
      }
    }

    return { isMeeting, date: meetingDate, duration: meetingDuration };
  }

  private static determineCategory(
    content: EmailContent,
    keywords: string[],
    actionItems: string[],
    meetingInfo: { isMeeting: boolean },
  ): EmailCategoryType {
    const text = `${content.subject} ${content.body}`.toLowerCase();

    // Check for meetings first
    if (meetingInfo.isMeeting) {
      return EmailCategoryType.meetings;
    }

    // Check for finance-related emails
    if (this.FINANCE_KEYWORDS.some((keyword) => text.includes(keyword))) {
      return EmailCategoryType.finance;
    }

    // Check for client-related emails
    if (this.CLIENT_KEYWORDS.some((keyword) => text.includes(keyword))) {
      return EmailCategoryType.clients;
    }

    // Check for waiting emails
    if (this.WAITING_KEYWORDS.some((keyword) => text.includes(keyword))) {
      return EmailCategoryType.waitingOn;
    }

    // Check for action required
    if (
      actionItems.length > 0 ||
      this.ACTION_KEYWORDS.some((keyword) => text.includes(keyword))
    ) {
      return EmailCategoryType.actionRequired;
    }

    // Default to reference
    return EmailCategoryType.reference;
  }

  private static determinePriority(
    content: EmailContent,
    category: EmailCategoryType,
    actionItems: string[],
    keywords: string[],
  ): EmailPriority {
    const text = `${content.subject} ${content.body}`.toLowerCase();

    // High priority indicators
    const highPriorityIndicators = [
      "urgent",
      "asap",
      "emergency",
      "critical",
      "immediate",
      "deadline",
      "today",
      "now",
      "right away",
      "important",
      "priority",
    ];

    if (highPriorityIndicators.some((indicator) => text.includes(indicator))) {
      return EmailPriority.urgent;
    }

    // Medium priority for action required or meetings
    if (
      category === EmailCategoryType.actionRequired ||
      category === EmailCategoryType.meetings
    ) {
      return EmailPriority.high;
    }

    // Medium priority for clients and finance
    if (
      category === EmailCategoryType.clients ||
      category === EmailCategoryType.finance
    ) {
      return EmailPriority.medium;
    }

    // Low priority for reference and waiting
    if (
      category === EmailCategoryType.reference ||
      category === EmailCategoryType.waitingOn
    ) {
      return EmailPriority.low;
    }

    return EmailPriority.medium;
  }

  private static calculateConfidence(
    category: EmailCategoryType,
    priority: EmailPriority,
    keywords: string[],
    actionItems: string[],
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on strong indicators
    if (actionItems.length > 0) confidence += 0.2;
    if (keywords.length > 5) confidence += 0.1;
    if (priority === EmailPriority.urgent) confidence += 0.1;
    if (category === EmailCategoryType.meetings) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private static extractClientInfo(content: EmailContent, entities: any) {
    // Simple client detection based on email domain and entities
    const fromDomain = content.from.split("@")[1]?.toLowerCase();

    // Check if it's from a known client domain
    const clientDomains = ["client.com", "customer.com"]; // Add your client domains
    const isFromClient = clientDomains.includes(fromDomain || "");

    return {
      clientName: isFromClient ? entities.companies[0] : undefined,
      projectName: undefined, // Would need more sophisticated detection
    };
  }

  private static requiresResponse(
    content: EmailContent,
    actionItems: string[],
    keywords: string[],
  ): boolean {
    const text = `${content.subject} ${content.body}`.toLowerCase();

    const responseKeywords = [
      "please respond",
      "please reply",
      "let me know",
      "get back to me",
      "confirm",
      "approve",
      "review",
      "feedback",
      "thoughts",
      "opinion",
    ];

    return (
      responseKeywords.some((keyword) => text.includes(keyword)) ||
      actionItems.length > 0
    );
  }

  private static extractDueDate(text: string): Date | undefined {
    const duePatterns = [
      /\bdue\s+(?:on\s+)?(\d{1,2}\/\d{1,2}\/\d{4})\b/gi,
      /\bdeadline\s+(?:is\s+)?(\d{1,2}\/\d{1,2}\/\d{4})\b/gi,
      /\bby\s+(\d{1,2}\/\d{1,2}\/\d{4})\b/gi,
    ];

    for (const pattern of duePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return undefined;
  }
}
