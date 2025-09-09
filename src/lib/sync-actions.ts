import Account from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";

export async function performInitialSync(userId: string, accountId: string) {
  const dbAccount = await db.account.findUnique({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!dbAccount) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  const account = new Account(dbAccount.token);
  await account.createSubscription();
  const response = await account.performInitialSync();

  if (!response) {
    throw new Error("FAILED_TO_SYNC");
  }

  const { deltaToken, emails } = response;

  await syncEmailsToDatabase(emails, accountId);

  await db.account.update({
    where: {
      token: dbAccount.token,
    },
    data: {
      nextDeltaToken: deltaToken,
    },
  });

  console.log("sync complete", deltaToken);
  return { success: true, deltaToken };
}
