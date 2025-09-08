"use client";
import { Button } from "@/components/ui/button";
import { getAurinkoAuthorizationUrl } from "@/lib/aurinko";
import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";
import { toast } from "sonner";
import { RefreshCw, AlertCircle } from "lucide-react";

export default function AuthoriseButton() {
  const syncEmails = api.mail.syncEmails.useMutation();
  const [accountId, setAccountId] = useLocalStorage("accountId", "");

  const { data: authStatus } = api.mail.checkAccountAuth.useQuery(
    { accountId },
    { enabled: !!accountId },
  );

  const handleSyncEmails = () => {
    if (!accountId) {
      toast.error("No account selected");
      return;
    }

    if (authStatus?.needsReauth) {
      toast.error(
        "Your account needs to be re-authorized. Please click 'Authorize Email' to continue.",
        {
          action: {
            label: "Authorize",
            onClick: () => {
              getAurinkoAuthorizationUrl("Google").then((url) => {
                window.location.href = url;
              });
            },
          },
        },
      );
      return;
    }

    syncEmails.mutate(
      { accountId },
      {
        onSuccess: () => {
          toast.success("Emails synced successfully");
        },
        onError: (error) => {
          console.error("Sync error:", error);
          if (error.message === "TOKEN_EXPIRED") {
            toast.error(
              "Your account authorization has expired. Please re-authorize your account.",
              {
                action: {
                  label: "Re-authorize",
                  onClick: () => {
                    getAurinkoAuthorizationUrl("Google").then((url) => {
                      window.location.href = url;
                    });
                  },
                },
              },
            );
          } else {
            toast.error(`Failed to sync emails: ${error.message}`);
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant={"outline"}
        onClick={handleSyncEmails}
        disabled={syncEmails.isPending || authStatus?.needsReauth}
        className="flex items-center gap-2"
      >
        {syncEmails.isPending ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {syncEmails.isPending
          ? "Syncing..."
          : authStatus?.needsReauth
            ? "Re-authorize Required"
            : "Sync Emails"}
      </Button>
      <Button
        size="sm"
        variant={"outline"}
        onClick={async () => {
          const url = await getAurinkoAuthorizationUrl("Google");
          window.location.href = url;
        }}
        className="flex items-center gap-2"
      >
        <AlertCircle className="h-4 w-4" />
        Authorize Email
      </Button>
    </div>
  );
}
