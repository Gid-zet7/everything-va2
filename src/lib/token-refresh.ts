import axios from "axios";
import { db } from "@/server/db";

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

/**
 * Refresh an expired Aurinko token
 */
export async function refreshAurinkoToken(accountId: string): Promise<boolean> {
  try {
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        token: true,
        refreshToken: true,
        tokenExpiresAt: true,
        emailAddress: true,
        name: true,
        userId: true,
      },
    });

    if (!account) {
      console.error("Account not found for token refresh:", accountId);
      return false;
    }

    // Check if we have a refresh token
    if (!account.refreshToken) {
      console.error("No refresh token available for account:", accountId);
      return false;
    }

    // Check if token is actually expired
    if (account.tokenExpiresAt && new Date() < account.tokenExpiresAt) {
      console.log("Token is not expired yet for account:", accountId);
      return true;
    }

    console.log("Attempting to refresh token for account:", accountId);

    try {
      const response = await axios.post(
        "https://api.aurinko.io/v1/auth/refresh",
        {
          refreshToken: account.refreshToken,
        },
        {
          auth: {
            username: process.env.AURINKO_CLIENT_ID as string,
            password: process.env.AURINKO_CLIENT_SECRET as string,
          },
        },
      );

      const tokenData = response.data as TokenResponse;

      if (!tokenData.accessToken) {
        console.error("No access token received in refresh response");
        return false;
      }

      // Calculate expiration time (default to 1 hour if not provided)
      const expiresIn = tokenData.expiresIn || 3600; // 1 hour in seconds
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // Update the account with new token
      await db.account.update({
        where: { id: accountId },
        data: {
          token: tokenData.accessToken,
          refreshToken: tokenData.refreshToken || account.refreshToken, // Keep old refresh token if new one not provided
          tokenExpiresAt,
        },
      });

      console.log("Token refreshed successfully for account:", accountId);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Token refresh failed:", error.response?.data);

        // If refresh token is invalid, mark account for re-auth
        if (error.response?.status === 401 || error.response?.status === 400) {
          await db.account.update({
            where: { id: accountId },
            data: {
              token: "",
              refreshToken: "",
              tokenExpiresAt: null,
            },
          });
          console.log("Account marked for re-authentication:", accountId);
        }
      } else {
        console.error("Unexpected error during token refresh:", error);
      }
      return false;
    }
  } catch (error) {
    console.error("Error in refreshAurinkoToken:", error);
    return false;
  }
}

/**
 * Check if a token needs refresh
 */
export async function needsTokenRefresh(accountId: string): Promise<boolean> {
  try {
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: {
        tokenExpiresAt: true,
        token: true,
      },
    });

    if (!account || !account.token) {
      return true; // Needs refresh if no token
    }

    if (!account.tokenExpiresAt) {
      return false; // No expiration set, assume valid
    }

    // Check if token expires within the next 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return account.tokenExpiresAt <= fiveMinutesFromNow;
  } catch (error) {
    console.error("Error checking token refresh need:", error);
    return true; // Assume needs refresh on error
  }
}

/**
 * Get a valid token for an account, refreshing if necessary
 */
export async function getValidToken(accountId: string): Promise<string | null> {
  try {
    // Check if token needs refresh
    if (await needsTokenRefresh(accountId)) {
      const refreshSuccess = await refreshAurinkoToken(accountId);
      if (!refreshSuccess) {
        return null;
      }
    }

    // Get the current token
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: { token: true },
    });

    return account?.token || null;
  } catch (error) {
    console.error("Error getting valid token:", error);
    return null;
  }
}
