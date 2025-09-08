"use client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Pencil } from "lucide-react";

import React from "react";
import EmailEditor from "./email-editor";
import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";
import { toast } from "sonner";
import { EmailAttachment } from "./email-editor/file-attachment";
import { processAttachments, checkAttachmentLimits } from "@/lib/file-utils";
import ErrorBoundary from "@/components/error-boundary";

const ComposeButton = () => {
  const [open, setOpen] = React.useState(false);
  const [accountId] = useLocalStorage("accountId", "");
  const [toValues, setToValues] = React.useState<
    { label: string; value: string }[]
  >([]);
  const [ccValues, setCcValues] = React.useState<
    { label: string; value: string }[]
  >([]);
  const [subject, setSubject] = React.useState<string>("");
  const [isProcessingAttachments, setIsProcessingAttachments] =
    React.useState(false);
  const { data: account } = api.mail.getMyAccount.useQuery({ accountId });

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "c" &&
        (event.ctrlKey || event.metaKey) &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName || "",
        )
      ) {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const sendEmail = api.mail.sendEmail.useMutation();

  const handleSend = async (value: string, attachments?: EmailAttachment[]) => {
    console.log(account);
    console.log({ value, attachments });
    if (!account) return;

    try {
      setIsProcessingAttachments(true);

      // Check attachment limits before processing
      if (attachments && attachments.length > 0) {
        const limitCheck = checkAttachmentLimits(attachments);
        if (!limitCheck.isValid) {
          toast.error(limitCheck.error);
          return;
        }
      }

      // Convert File objects to base64 content using optimized processing
      const processedAttachments = attachments
        ? await processAttachments(attachments, (progress) => {
            if (progress === 100) {
              toast.success("Attachments processed successfully");
            }
          })
        : [];

      sendEmail.mutate(
        {
          accountId,
          threadId: undefined,
          body: value,
          subject,
          from: {
            name: account?.name ?? "Me",
            address: account?.emailAddress ?? "me@example.com",
          },
          to: toValues.map((to) => ({ name: to.value, address: to.value })),
          cc: ccValues.map((cc) => ({ name: cc.value, address: cc.value })),
          replyTo: {
            name: account?.name ?? "Me",
            address: account?.emailAddress ?? "me@example.com",
          },
          inReplyTo: undefined,
          attachments: processedAttachments,
        },
        {
          onSuccess: () => {
            toast.success("Email sent");
            setOpen(false);
          },
          onError: (error) => {
            console.error("Error sending email:", error);
            if (error.message.includes("400")) {
              toast.error(
                "Failed to send email: File attachments may be too large. Please try reducing the file sizes or removing some attachments.",
              );
            } else {
              toast.error(`Failed to send email: ${error.message}`);
            }
          },
        },
      );
    } catch (error) {
      console.error("Error processing attachments:", error);
      toast.error("Failed to process attachments");
    } finally {
      setIsProcessingAttachments(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Pencil className="mr-1 size-4" />
          Compose
        </Button>
      </DrawerTrigger>
      <DrawerContent className="">
        <DrawerHeader>
          <DrawerTitle>Compose Email</DrawerTitle>
          <ErrorBoundary>
            <EmailEditor
              toValues={toValues}
              ccValues={ccValues}
              onToChange={(values) => {
                setToValues(values);
              }}
              onCcChange={(values) => {
                setCcValues(values);
              }}
              subject={subject}
              setSubject={setSubject}
              to={toValues.map((to) => to.value)}
              handleSend={handleSend}
              isSending={sendEmail.isPending || isProcessingAttachments}
              defaultToolbarExpand
            />
          </ErrorBoundary>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
};

export default ComposeButton;
