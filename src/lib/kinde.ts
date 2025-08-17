import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { env } from "@/env";

export const getKindeUser = async () => {
  const { user } = await getKindeServerSession();
  return user;
};

export { getKindeServerSession };
