import { db } from "@/server/db";

/**
 * Check if an account needs re-authentication
 */
export async function checkAccountAuthStatus(accountId: string): Promise<{
  needsReauth: boolean;
  account?: any;
}> {
  try {
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        token: true,
        emailAddress: true,
        name: true,
        provider: true,
      },
    });

    if (!account) {
      return { needsReauth: true };
    }

    // Check if token is empty or null
    if (!account.token || account.token.trim() === "") {
      return { needsReauth: true, account };
    }

    return { needsReauth: false, account };
  } catch (error) {
    console.error("Error checking account auth status:", error);
    return { needsReauth: true };
  }
}

/**
 * Mark account as needing re-authentication
 */
export async function markAccountForReauth(accountId: string): Promise<void> {
  try {
    await db.account.update({
      where: { id: accountId },
      data: { token: "" },
    });
  } catch (error) {
    console.error("Error marking account for reauth:", error);
  }
}

/**
 * Get all accounts for a user
 */
export async function getUserAccounts(userId: string) {
  try {
    return await db.account.findMany({
      where: { userId },
      select: {
        id: true,
        emailAddress: true,
        name: true,
        provider: true,
        token: true,
      },
    });
  } catch (error) {
    console.error("Error getting user accounts:", error);
    return [];
  }
}
