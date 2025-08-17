import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { env } from "@/env";
import { redirect } from "next/navigation";

export const getKindeUser = async () => {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/auth/login");
  }

  const kindeUser = await getUser();
  return kindeUser;
};

export { getKindeServerSession };
