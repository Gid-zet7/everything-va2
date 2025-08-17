import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { env } from "@/env";

export const getKindeUser = async () => {
  const session = await getKindeServerSession();
  return session.user;
};

export { getKindeServerSession };
