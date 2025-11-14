"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";
import { Plus } from "lucide-react";
import { getAurinkoAuthorizationUrl } from "@/lib/aurinko";
import { toast } from "sonner";

interface CalendarSwitcherProps {
  isCollapsed?: boolean;
}

const ALL_CALENDARS_VALUE = "all";

export function CalendarSwitcher({ isCollapsed = false }: CalendarSwitcherProps) {
  const { data: accounts } = api.mail.getAccounts.useQuery();
  const [accountId, setAccountId] = useLocalStorage("calendarAccountId", "");
  const [calendarId, setCalendarId] = useLocalStorage("calendarId", ALL_CALENDARS_VALUE);
  const [mounted, setMounted] = React.useState(false);

  // Get calendars for the selected account
  const { data: calendars } = api.calendar.getCalendarsByAccount.useQuery(
    { accountId: accountId || "" },
    { enabled: !!accountId && mounted }
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    
    // Auto-select first account if none selected
    if (accounts && accounts.length > 0 && !accountId) {
      setAccountId(accounts[0]!.id);
    }
  }, [accounts, accountId, setAccountId, mounted]);

  React.useEffect(() => {
    if (!mounted || !accountId) return;
    
    // Migrate old empty string values to "all"
    if (calendarId === "") {
      setCalendarId(ALL_CALENDARS_VALUE);
      return;
    }
    
    // If a calendarId is set but doesn't exist in the calendars list, reset it
    if (calendars && calendars.length > 0 && calendarId && calendarId !== ALL_CALENDARS_VALUE) {
      const storedCalendar = calendars.find(c => c.id === calendarId);
      if (!storedCalendar) {
        // Calendar no longer exists, reset to "view all"
        setCalendarId(ALL_CALENDARS_VALUE);
      }
    }
  }, [calendars, calendarId, setCalendarId, mounted, accountId]);

  const handleAddAccount = async () => {
    try {
      const url = await getAurinkoAuthorizationUrl("Google");
      window.location.href = url;
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!accounts || !mounted) return <></>;
  
  const selectedAccount = accounts.find((acc) => acc.id === accountId);
  const selectedCalendar = calendarId === ALL_CALENDARS_VALUE 
    ? null 
    : calendars?.find((cal) => cal.id === calendarId);

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row">
      {/* Account Selector */}
      <div className="flex-1">
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger
            className={cn(
              "flex w-full items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
              isCollapsed &&
                "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
            )}
            aria-label="Select account"
          >
            <SelectValue placeholder="Select an account">
              <span className={cn({ hidden: !isCollapsed })}>
                {selectedAccount?.emailAddress?.[0] || "A"}
              </span>
              <span className={cn("ml-2", isCollapsed && "hidden")}>
                {selectedAccount?.emailAddress || "Select account"}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex items-center gap-3">
                  {account.emailAddress}
                </div>
              </SelectItem>
            ))}
            <div
              onClick={handleAddAccount}
              className="relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <Plus className="mr-1 size-4" />
              Add account
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Selector - only show if account is selected */}
      {accountId && (
        <div className="flex-1">
          <Select value={calendarId} onValueChange={setCalendarId}>
            <SelectTrigger
              className={cn(
                "flex w-full items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
                isCollapsed &&
                  "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
              )}
              aria-label="Select calendar"
            >
              <SelectValue placeholder="Select a calendar">
                <span className={cn({ hidden: !isCollapsed })}>
                  {selectedCalendar?.name?.[0] || "C"}
                </span>
                <span className={cn("ml-2 flex items-center gap-2", isCollapsed && "hidden")}>
                  {selectedCalendar ? (
                    <>
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: selectedCalendar.color || "#3b82f6",
                        }}
                      />
                      {selectedCalendar.name}
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-3 rounded-full border-2 border-dashed border-muted-foreground" />
                      All Calendars
                    </>
                  )}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CALENDARS_VALUE}>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full border-2 border-dashed border-muted-foreground" />
                  <div className="flex flex-col">
                    <span>All Calendars</span>
                    <span className="text-xs text-muted-foreground">
                      View events from all calendars
                    </span>
                  </div>
                </div>
              </SelectItem>
              {calendars?.map((calendar) => (
                <SelectItem key={calendar.id} value={calendar.id}>
                  <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: calendar.color || "#3b82f6",
                      }}
                    />
                    <div className="flex flex-col">
                      <span>{calendar.name}</span>
                      {calendar.isPrimary && (
                        <span className="text-xs text-muted-foreground">Primary</span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
