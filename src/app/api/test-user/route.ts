import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getKindeUserForAPI } from "@/lib/kinde";

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

    // Check if user exists in database by email address
    const dbUser = await db.user.findUnique({
      where: { emailAddress: user.email || "" },
    });

    if (!dbUser) {
      // Create user in database
      const newUser = await db.user.create({
        data: {
          id: user.id,
          emailAddress: user.email || "",
          firstName: (user as any).given_name || (user as any).first_name || "",
          lastName: (user as any).family_name || (user as any).last_name || "",
          imageUrl: user.picture || "",
        },
      });

      return NextResponse.json({
        message: "User created successfully",
        user: {
          id: newUser.id,
          email: newUser.emailAddress,
          name: `${newUser.firstName} ${newUser.lastName}`,
        },
        created: true,
      });
    }

    return NextResponse.json({
      message: "User already exists",
      user: {
        id: dbUser.id,
        email: dbUser.emailAddress,
        name: `${dbUser.firstName} ${dbUser.lastName}`,
      },
      created: false,
    });
  } catch (error) {
    console.error("Error in test-user endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
