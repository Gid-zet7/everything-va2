import { getKindeServerSession } from "@/lib/kinde";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { login } = await getKindeServerSession();
  return login(request);
}
