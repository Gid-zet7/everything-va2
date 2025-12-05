import { getKindeUser } from "@/lib/kinde";
import { redirect } from "next/navigation";
import MailWrapper from "./mail-wrapper";

export default async function Home() {
  const user = await getKindeUser();

  // console.log("Mail page user:", user);

  if (!user?.id) {
    console.log("No user found, redirecting to home");
    redirect("/");
  }

  return <MailWrapper />;
}
