import { getKindeServerSession } from "@/lib/kinde";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { logout } = await getKindeServerSession();
  return logout(request);
}
