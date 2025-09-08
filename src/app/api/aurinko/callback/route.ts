import { getAccountDetails, getAurinkoToken } from "@/lib/aurinko";
import { waitUntil } from "@vercel/functions";
import { db } from "@/server/db";
import { getKindeUserForAPI } from "@/lib/kinde";
import { performInitialSync } from "@/lib/sync-actions";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const user = await getKindeUserForAPI();
    // console.log("aurinko callback", user);
    if (!user?.id)
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const userId = user.id as string;

    const params = req.nextUrl.searchParams;
    const status = params.get("status");
    if (status !== "success")
      return NextResponse.json(
        { error: "Account connection failed" },
        { status: 400 },
      );

    const code = params.get("code");
    const token = await getAurinkoToken(code as string);
    // console.log("token", token);
    if (!token)
      return NextResponse.json(
        { error: "Failed to fetch token" },
        { status: 400 },
      );
    const accountDetails = await getAccountDetails(token.accessToken);

    // Calculate token expiration time
    const expiresIn = token.expiresIn || 3600; // Default to 1 hour
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    await db.account.upsert({
      where: { id: token.accountId.toString() },
      create: {
        id: token.accountId.toString(),
        userId,
        token: token.accessToken,
        refreshToken: token.refreshToken || null,
        tokenExpiresAt,
        provider: "Aurinko",
        emailAddress: accountDetails.email,
        name: accountDetails.name,
      },
      update: {
        token: token.accessToken,
        refreshToken: token.refreshToken || undefined,
        tokenExpiresAt,
      },
    });
    waitUntil(
      performInitialSync(userId, token.accountId.toString())
        .then((result) => {
          console.log("Initial sync result:", result);
        })
        .catch((error) => {
          console.error("Initial sync error:", error);
        }),
    );

    return NextResponse.redirect(new URL("/mail", req.url));
  } catch (error) {
    console.error("Aurinko callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};
