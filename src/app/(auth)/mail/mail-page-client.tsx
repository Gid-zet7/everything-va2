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
      {/* Responsive bottom controls */}
      <div className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/80 p-2 shadow-lg backdrop-blur-sm md:flex-nowrap md:justify-start">
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="hidden sm:inline">Guest User</span>
            <LogoutLink className="text-xs md:text-sm">Logout</LogoutLink>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <ModeToggle />
            <ComposeButton />
            <AuthoriseButton />
            {process.env.NODE_ENV === "development" && <WebhookDebugger />}
          </div>
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
