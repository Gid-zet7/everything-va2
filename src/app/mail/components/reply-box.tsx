"use client";
import React from "react";
import EmailEditor from "./email-editor";
import { useThread } from "../use-thread";
import useThreads from "../use-threads";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { EmailAttachment } from "./email-editor/file-attachment";
import { processAttachments, checkAttachmentLimits } from "@/lib/file-utils";
import ErrorBoundary from "@/components/error-boundary";

const ReplyBox = () => {
  const [threadId] = useThread();
  const { accountId } = useThreads();
  const { data: replyDetails } = api.mail.getReplyDetails.useQuery({
    accountId: accountId,
    threadId: threadId || "",
    replyType: "reply",
  });
  if (!replyDetails) return <></>;
  return <Component replyDetails={replyDetails} />;
};

const Component = ({
  replyDetails,
}: {
  replyDetails: NonNullable<RouterOutputs["mail"]["getReplyDetails"]>;
}) => {
  const [threadId] = useThread();
  const { accountId } = useThreads();

  const [subject, setSubject] = React.useState(
    replyDetails.subject.startsWith("Re:")
      ? replyDetails.subject
      : `Re: ${replyDetails.subject}`,
  );

  const [toValues, setToValues] = React.useState<
    { label: string; value: string }[]
  >(
    replyDetails.to.map((to) => ({
      label: to.address ?? to.name,
      value: to.address,
    })) || [],
  );
  const [ccValues, setCcValues] = React.useState<
    { label: string; value: string }[]
  >(
    replyDetails.cc.map((cc) => ({
      label: cc.address ?? cc.name,
      value: cc.address,
    })) || [],
  );
  const [isProcessingAttachments, setIsProcessingAttachments] =
    React.useState(false);

  const sendEmail = api.mail.sendEmail.useMutation();
  React.useEffect(() => {
    if (!replyDetails || !threadId) return;

    if (!replyDetails.subject.startsWith("Re:")) {
      setSubject(`Re: ${replyDetails.subject}`);
    }
    setToValues(
      replyDetails.to.map((to) => ({
        label: to.address ?? to.name,
        value: to.address,
      })),
    );
    setCcValues(
      replyDetails.cc.map((cc) => ({
        label: cc.address ?? cc.name,
        value: cc.address,
      })),
    );
  }, [replyDetails, threadId]);

  const handleSend = async (value: string, attachments?: EmailAttachment[]) => {
    if (!replyDetails) return;

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
          threadId: threadId ?? undefined,
          body: value,
          subject,
          from: replyDetails.from,
          to: replyDetails.to.map((to) => ({
            name: to.name ?? to.address,
            address: to.address,
          })),
          cc: replyDetails.cc.map((cc) => ({
            name: cc.name ?? cc.address,
            address: cc.address,
          })),
          replyTo: replyDetails.from,
          inReplyTo: replyDetails.id,
          attachments: processedAttachments,
        },
        {
          onSuccess: () => {
            toast.success("Email sent");
            // editor?.commands.clearContent()
          },
          onError: (error: any) => {
            console.error("Error sending email:", error);
            let errorMessage = error.message || "Failed to send email";
            
            // Check for specific error types
            if (error.status === 400) {
              const apiMessage = error.responseData?.message || error.responseData?.error;
              if (apiMessage) {
                errorMessage = `Failed to send email: ${apiMessage}`;
              } else {
                errorMessage = "Failed to send email: Invalid request. Please check that attachments are valid and within size limits (max 25MB per file, 50MB total).";
              }
            } else if (error.status === 413) {
              errorMessage = "Failed to send email: File attachments are too large. Please reduce file sizes or remove some attachments.";
            } else if (error.status === 401 || error.status === 403) {
              errorMessage = "Failed to send email: Authentication failed. Please re-authorize your email account.";
            }
            
            toast.error(errorMessage);
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
      />
    </ErrorBoundary>
  );
};

export default ReplyBox;
