"use client";

import { Mail } from "@/app/mail/components/mail";

interface MailClientProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export default function MailClient({
  defaultLayout,
  defaultCollapsed,
  navCollapsedSize,
}: MailClientProps) {
  return (
    <>
      {/* Mobile responsive message */}
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center md:hidden">
        <div className="max-w-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Desktop Experience</h2>
          <p className="text-sm text-muted-foreground">
            For the best experience, please use a desktop or tablet device with
            a larger screen.
          </p>
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Mobile version coming soon!
            </p>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden h-screen flex-col overflow-hidden md:flex">
        <Mail
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={navCollapsedSize}
        />
      </div>
    </>
  );
}
