"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccountSwitcher } from "@/app/mail/components/account-switcher";
import { ThreadDisplay } from "./thread-display";
import { ThreadList } from "./thread-list";
import { useLocalStorage } from "usehooks-ts";
import SideBar from "./sidebar";
import SearchBar from "./search-bar";
import { isSearchingAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import AskAI from "./ask-ai";
import { EmailOrganizer } from "./email-organizer";

interface MailProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function Mail({
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const [done, setDone] = useLocalStorage("normalhuman-done", false);
  const [tab] = useLocalStorage("normalhuman-tab", "inbox");
  const [accountId] = useLocalStorage("accountId", "");
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // Clean up corrupted cookies on mount
  React.useEffect(() => {
    try {
      // Check if the layout cookie is valid
      const layoutCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("react-resizable-panels:layout:mail="));

      if (layoutCookie) {
        const layoutValue = layoutCookie.split("=")[1];
        if (layoutValue) {
          JSON.parse(layoutValue); // This will throw if invalid
        }
      }
    } catch (error) {
      console.warn("Clearing corrupted layout cookie");
      document.cookie =
        "react-resizable-panels:layout:mail=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }

    try {
      // Check if the collapsed cookie is valid
      const collapsedCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("react-resizable-panels:collapsed="));

      if (collapsedCookie) {
        const collapsedValue = collapsedCookie.split("=")[1];
        if (collapsedValue) {
          JSON.parse(collapsedValue); // This will throw if invalid
        }
      }
    } catch (error) {
      console.warn("Clearing corrupted collapsed cookie");
      document.cookie =
        "react-resizable-panels:collapsed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          try {
            document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
              sizes,
            )}`;
          } catch (error) {
            console.warn("Failed to save layout cookie:", error);
          }
        }}
        className="h-full min-h-screen items-stretch"
        id="mail"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={12}
          maxSize={35}
          onCollapse={() => {
            setIsCollapsed(true);
            try {
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                true,
              )}`;
            } catch (error) {
              console.warn("Failed to save collapsed cookie:", error);
            }
          }}
          onResize={() => {
            setIsCollapsed(false);
            try {
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                false,
              )}`;
            } catch (error) {
              console.warn("Failed to save collapsed cookie:", error);
            }
          }}
          className={cn(
            isCollapsed &&
              "min-w-[50px] transition-all duration-300 ease-in-out",
          )}
        >
          <div className="flex h-full flex-1 flex-col">
            <div
              className={cn(
                "flex h-[52px] items-center justify-center",
                isCollapsed ? "h-[52px]" : "px-2",
              )}
            >
              <AccountSwitcher isCollapsed={isCollapsed} />
            </div>
            <Separator />
            <SideBar isCollapsed={isCollapsed} />
            <div className="flex-1"></div>
            <AskAI isCollapsed={isCollapsed} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          {tab === "organizer" ? (
            <div className="h-full overflow-auto">
              <EmailOrganizer accountId={accountId} />
            </div>
          ) : (
            <Tabs
              defaultValue="inbox"
              value={done ? "done" : "inbox"}
              onValueChange={(tab) => {
                if (tab === "done") {
                  setDone(true);
                } else {
                  setDone(false);
                }
              }}
            >
              <div className="flex items-center px-4 py-2">
                <h1 className="text-xl font-bold">Inbox</h1>
                <TabsList className="ml-auto">
                  <TabsTrigger
                    value="inbox"
                    className="text-zinc-600 dark:text-zinc-200"
                  >
                    Inbox
                  </TabsTrigger>
                  <TabsTrigger
                    value="done"
                    className="text-zinc-600 dark:text-zinc-200"
                  >
                    Done
                  </TabsTrigger>
                </TabsList>
              </div>
              <Separator />
              <SearchBar />
              <TabsContent value="inbox" className="m-0">
                <ThreadList />
              </TabsContent>
              <TabsContent value="done" className="m-0">
                <ThreadList />
              </TabsContent>
            </Tabs>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <ThreadDisplay />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
