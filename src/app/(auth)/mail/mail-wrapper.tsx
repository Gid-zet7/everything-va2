import { cookies } from "next/headers";
import MailPageClient from "./mail-page-client";

export default function MailWrapper() {
  const layout = cookies().get("react-resizable-panels:layout:mail");
  const collapsed = cookies().get("react-resizable-panels:collapsed");

  let defaultLayout: number[] | undefined;
  let defaultCollapsed: boolean | undefined;

  try {
    defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  } catch (error) {
    console.warn("Failed to parse layout cookie:", error);
    defaultLayout = undefined;
  }

  try {
    defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;
  } catch (error) {
    console.warn("Failed to parse collapsed cookie:", error);
    defaultCollapsed = undefined;
  }

  return (
    <MailPageClient
      defaultLayout={defaultLayout}
      defaultCollapsed={defaultCollapsed}
      navCollapsedSize={4}
    />
  );
}
