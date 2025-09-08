import type {
  EmailHeader,
  EmailMessage,
  SyncResponse,
  SyncUpdatedResponse,
} from "@/lib/types";
import { db } from "@/server/db";
import axios from "axios";
import { syncEmailsToDatabase } from "./sync-to-db";
import { getValidToken } from "./token-refresh";

const API_BASE_URL = "https://api.aurinko.io/v1";

class Account {
  private token: string;
  private accountId: string;

  constructor(token: string, accountId?: string) {
    this.token = token;
    this.accountId = accountId || "";
  }

  private async startSync(daysWithin: number): Promise<SyncResponse> {
    const response = await axios.post<SyncResponse>(
      `${API_BASE_URL}/email/sync`,
      {},
      {
        headers: { Authorization: `Bearer ${this.token}` },
        params: {
          daysWithin,
          bodyType: "html",
        },
      },
    );
    return response.data;
  }

  async createSubscription() {
    const webhookUrl =
      process.env.NODE_ENV === "development"
        ? "https://simplified-bl-fed-gale.trycloudflare.com"
        : process.env.NEXT_PUBLIC_URL;
    const res = await axios.post(
      "https://api.aurinko.io/v1/subscriptions",
      {
        resource: "/email/messages",
        notificationUrl: webhookUrl + "/api/aurinko/webhook",
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      },
    );
    return res.data;
  }

  async syncEmails() {
    const account = await db.account.findUnique({
      where: {
        token: this.token,
      },
    });
    if (!account) throw new Error("Invalid token");

    // Update accountId if not set
    if (!this.accountId) {
      this.accountId = account.id;
    }

    // If no delta token exists, perform initial sync
    if (!account.nextDeltaToken) {
      console.log("No delta token found, performing initial sync");
      const initialSyncResult = await this.performInitialSync();
      if (!initialSyncResult) {
        throw new Error("Failed to perform initial sync");
      }
      
      // Sync the emails to database
      try {
        await syncEmailsToDatabase(initialSyncResult.emails, account.id);
      } catch (error) {
        console.log("Error syncing emails to database:", error);
      }
      
      // Update the account with the delta token from initial sync
      await db.account.update({
        where: {
          id: account.id,
        },
        data: {
          nextDeltaToken: initialSyncResult.deltaToken,
        },
      });
      
      return;
    }

    try {
      let response = await this.getUpdatedEmails({
        deltaToken: account.nextDeltaToken,
      });
      let allEmails: EmailMessage[] = response.records;
      let storedDeltaToken = account.nextDeltaToken;
      if (response.nextDeltaToken) {
        storedDeltaToken = response.nextDeltaToken;
      }
      while (response.nextPageToken) {
        response = await this.getUpdatedEmails({
          pageToken: response.nextPageToken,
        });
        allEmails = allEmails.concat(response.records);
        if (response.nextDeltaToken) {
          storedDeltaToken = response.nextDeltaToken;
        }
      }

      if (!response) throw new Error("Failed to sync emails");

      try {
        await syncEmailsToDatabase(allEmails, account.id);
      } catch (error) {
        console.log("error", error);
      }

      // console.log('syncEmails', response)
      await db.account.update({
        where: {
          id: account.id,
        },
        data: {
          nextDeltaToken: storedDeltaToken,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "TOKEN_EXPIRED") {
        // Mark account as needing re-authentication
        await db.account.update({
          where: {
            id: account.id,
          },
          data: {
            token: "", // Clear the expired token
          },
        });
        throw new Error("TOKEN_EXPIRED");
      }
      throw error;
    }
  }

  async getUpdatedEmails({
    deltaToken,
    pageToken,
  }: {
    deltaToken?: string;
    pageToken?: string;
  }): Promise<SyncUpdatedResponse> {
    // console.log('getUpdatedEmails', { deltaToken, pageToken });
    let params: Record<string, string> = {};
    if (deltaToken) {
      params.deltaToken = deltaToken;
    }
    if (pageToken) {
      params.pageToken = pageToken;
    }

    try {
      // Try to get a valid token if we have an accountId
      let tokenToUse = this.token;
      if (this.accountId) {
        const validToken = await getValidToken(this.accountId);
        if (validToken) {
          tokenToUse = validToken;
          this.token = validToken; // Update the instance token
        }
      }

      const response = await axios.get<SyncUpdatedResponse>(
        `${API_BASE_URL}/email/sync/updated`,
        {
          params,
          headers: { Authorization: `Bearer ${tokenToUse}` },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token is expired or invalid
        throw new Error("TOKEN_EXPIRED");
      }
      throw error;
    }
  }

  async performInitialSync() {
    try {
      // Start the sync process
      const daysWithin = 3;
      let syncResponse = await this.startSync(daysWithin); // Sync emails from the last 7 days

      // Wait until the sync is ready
      while (!syncResponse.ready) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second
        syncResponse = await this.startSync(daysWithin);
      }

      // console.log('Sync is ready. Tokens:', syncResponse);

      // Perform initial sync of updated emails
      let storedDeltaToken: string = syncResponse.syncUpdatedToken;
      let updatedResponse = await this.getUpdatedEmails({
        deltaToken: syncResponse.syncUpdatedToken,
      });
      // console.log('updatedResponse', updatedResponse)
      if (updatedResponse.nextDeltaToken) {
        storedDeltaToken = updatedResponse.nextDeltaToken;
      }
      let allEmails: EmailMessage[] = updatedResponse.records;

      // Fetch all pages if there are more
      while (updatedResponse.nextPageToken) {
        updatedResponse = await this.getUpdatedEmails({
          pageToken: updatedResponse.nextPageToken,
        });
        allEmails = allEmails.concat(updatedResponse.records);
        if (updatedResponse.nextDeltaToken) {
          storedDeltaToken = updatedResponse.nextDeltaToken;
        }
      }

      // console.log('Initial sync complete. Total emails:', allEmails.length);

      // Store the nextDeltaToken for future incremental syncs

      // Example of using the stored delta token for an incremental sync
      // await this.performIncrementalSync(storedDeltaToken);
      return {
        emails: allEmails,
        deltaToken: storedDeltaToken,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error during sync:",
          JSON.stringify(error.response?.data, null, 2),
        );
      } else {
        console.error("Error during sync:", error);
      }
    }
  }

  async sendEmail({
    from,
    subject,
    body,
    inReplyTo,
    references,
    threadId,
    to,
    cc,
    bcc,
    replyTo,
    attachments,
  }: {
    from: EmailAddress;
    subject: string;
    body: string;
    inReplyTo?: string;
    references?: string;
    threadId?: string;
    to: EmailAddress[];
    cc?: EmailAddress[];
    bcc?: EmailAddress[];
    replyTo?: EmailAddress;
    attachments?: Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      content: string; // base64 encoded content
    }>;
  }) {
    try {
      const requestBody: any = {
        from,
        subject,
        body,
        inReplyTo,
        references,
        threadId,
        to,
        cc,
        bcc,
        replyTo: [replyTo],
      };

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        requestBody.attachments = attachments.map((attachment) => ({
          name: attachment.name,
          contentType: attachment.type,
          content: attachment.content,
        }));
      }

      const response = await axios.post(
        `${API_BASE_URL}/email/messages`,
        requestBody,
        {
          params: {
            returnIds: true,
          },
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );

      console.log("sendmail", response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error sending email:",
          JSON.stringify(error.response?.data, null, 2),
        );
      } else {
        console.error("Error sending email:", error);
      }
      throw error;
    }
  }

  async getWebhooks() {
    type Response = {
      records: {
        id: number;
        resource: string;
        notificationUrl: string;
        active: boolean;
        failSince: string;
        failDescription: string;
      }[];
      totalSize: number;
      offset: number;
      done: boolean;
    };
    const res = await axios.get<Response>(`${API_BASE_URL}/subscriptions`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  }

  async createWebhook(resource: string, notificationUrl: string) {
    const res = await axios.post(
      `${API_BASE_URL}/subscriptions`,
      {
        resource,
        notificationUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      },
    );
    return res.data;
  }

  async deleteWebhook(subscriptionId: string) {
    const res = await axios.delete(
      `${API_BASE_URL}/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      },
    );
    return res.data;
  }
}
type EmailAddress = {
  name: string;
  address: string;
};

export default Account;
