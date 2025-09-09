import { getKindeServerSession } from "@/lib/kinde";
import { redirect } from "next/navigation";

export default async function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getUser } = await getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    redirect("/sign-in");
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
