import { getKindeUserForAPI } from "@/lib/kinde";
import { performInitialSync } from "@/lib/sync-actions";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export const POST = async (req: NextRequest) => {
  try {
    const user = await getKindeUserForAPI();
    console.log("initial sync", user);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { accountId } = body;
    const userId = user.id as string;
    if (!accountId)
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

    const result = await performInitialSync(userId, accountId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Initial sync error:", error);
    if (error instanceof Error) {
      if (error.message === "ACCOUNT_NOT_FOUND") {
        return NextResponse.json(
          { error: "ACCOUNT_NOT_FOUND" },
          { status: 404 },
        );
      }
      if (error.message === "FAILED_TO_SYNC") {
        return NextResponse.json({ error: "FAILED_TO_SYNC" }, { status: 500 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};
