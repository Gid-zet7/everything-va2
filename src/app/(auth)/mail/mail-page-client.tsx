"use client";

import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import ComposeButton from "@/app/mail/components/compose-button";
import WebhookDebugger from "@/app/mail/components/webhook-debugger";
import TopAccountSwitcher from "./top-account-switcher";
import MailClient from "@/app/mail/mail-client";
import AuthoriseButton from "@/components/authorise-button";
import Kbar from "@/app/mail/components/kbar";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";

interface MailPageClientProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export default function MailPageClient({
  defaultLayout,
  defaultCollapsed,
  navCollapsedSize,
}: MailPageClientProps) {
  return (
    <Kbar>
      <div className="absolute bottom-4 left-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Guest User</span>
            <LogoutLink className="text-sm">Logout </LogoutLink>
          </div>
          <ModeToggle />
          <ComposeButton />
          <AuthoriseButton />
          {process.env.NODE_ENV === "development" && <WebhookDebugger />}
        </div>
      </div>

      {/* <div className="border-b ">
        <TopAccountSwitcher />
      </div> */}
      <MailClient
        defaultLayout={defaultLayout}
        defaultCollapsed={defaultCollapsed}
        navCollapsedSize={navCollapsedSize}
      />
    </Kbar>
  );
}
