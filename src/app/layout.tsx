import "@/styles/globals.css";
import Kbar from "@/app/mail/components/kbar";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Normal Human",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <Providers>
          <Kbar>{children}</Kbar>
        </Providers>
      </body>
    </html>
  );
}
