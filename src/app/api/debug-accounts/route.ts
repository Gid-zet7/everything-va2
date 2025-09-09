import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getKindeUserForAPI } from "@/lib/kinde";
import { getSubscriptionStatus } from "@/lib/stripe-actions";
import { FREE_ACCOUNTS_PER_USER, PRO_ACCOUNTS_PER_USER } from "@/app/constants";

export async function GET() {
  try {
    const user = await getKindeUserForAPI();

    if (!user?.id) {
      return NextResponse.json(
        {
          error: "No authenticated user found",
          message: "Please sign in first",
        },
        { status: 401 },
      );
    }

    const userId = user.id;

    // Get user details
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          error: "User not found in database",
        },
        { status: 404 },
      );
    }

    // Get subscription status
    const isSubscribed = await getSubscriptionStatus();

    // Get account count
    const accountCount = await db.account.count({
      where: { userId },
    });

    // Get account details
    const accounts = await db.account.findMany({
      where: { userId },
      select: {
        id: true,
        emailAddress: true,
        name: true,
        provider: true,
      },
    });

    const maxAccounts = isSubscribed
      ? PRO_ACCOUNTS_PER_USER
      : FREE_ACCOUNTS_PER_USER;

    return NextResponse.json({
      user: {
        id: userId,
        role: dbUser.role,
        isSubscribed,
      },
      accounts: {
        count: accountCount,
        maxAllowed: maxAccounts,
        canAddMore: accountCount < maxAccounts,
        list: accounts,
      },
      limits: {
        freeAccounts: FREE_ACCOUNTS_PER_USER,
        proAccounts: PRO_ACCOUNTS_PER_USER,
      },
    });
  } catch (error) {
    console.error("Error in debug-accounts endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getKindeUserForAPI();

    if (!user?.id) {
      return NextResponse.json(
        {
          error: "No authenticated user found",
          message: "Please sign in first",
        },
        { status: 401 },
      );
    }

    const userId = user.id;
    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        {
          error: "Account ID is required",
        },
        { status: 400 },
      );
    }

    // Verify the account belongs to the user
    const account = await db.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          error: "Account not found or doesn't belong to user",
        },
        { status: 404 },
      );
    }

    // Delete the account and all related data
    await db.account.delete({
      where: {
        id: accountId,
      },
    });

    return NextResponse.json({
      message: "Account deleted successfully",
      deletedAccount: {
        id: accountId,
        emailAddress: account.emailAddress,
      },
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
