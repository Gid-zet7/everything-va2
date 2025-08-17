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
      <div className="md:hidden">
        <img
          src="/examples/mail-dark.png"
          width={1280}
          height={727}
          alt="Mail"
          className="hidden dark:block"
        />
        <img
          src="/examples/mail-light.png"
          width={1280}
          height={727}
          alt="Mail"
          className="block dark:hidden"
        />
      </div>
      <div className="hidden h-screen flex-col overflow-scroll md:flex">
        <Mail
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={navCollapsedSize}
        />
      </div>
    </>
  );
}
