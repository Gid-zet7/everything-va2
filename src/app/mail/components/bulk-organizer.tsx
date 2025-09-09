"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Edit,
  Tag,
  Flag,
  Archive,
  Eye,
  EyeOff,
  Clock,
  Users,
  Save,
  RotateCcw,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";

interface BulkOrganizerProps {
  emails: any[];
  onUpdate?: () => void;
}

interface BulkUpdateData {
  categoryId?: string;
  priority?: string;
  status?: string;
  customLabels?: string[];
}

export function BulkOrganizer({ emails, onUpdate }: BulkOrganizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [updateData, setUpdateData] = useState<BulkUpdateData>({});
  const [selectAll, setSelectAll] = useState(false);

  const { data: categories = [] } = api.mail.getEmailCategories.useQuery(
    { accountId: emails[0]?.thread?.accountId || "" },
    { enabled: !!emails[0]?.thread?.accountId },
  );

  const bulkUpdateMutation = api.mail.bulkUpdateEmails.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully updated ${data.updatedCount} emails!`);
      setIsOpen(false);
      setSelectedEmails(new Set());
      setUpdateData({});
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(`Failed to update emails: ${error.message}`);
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedEmails(new Set(emails.map((email) => email.id)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleSelectEmail = (emailId: string, checked: boolean) => {
    const newSelected = new Set(selectedEmails);
    if (checked) {
      newSelected.add(emailId);
    } else {
      newSelected.delete(emailId);
    }
    setSelectedEmails(newSelected);
    setSelectAll(newSelected.size === emails.length);
  };

  const handleSave = () => {
    if (selectedEmails.size === 0) {
      toast.error("Please select at least one email");
      return;
    }

    // Filter out "keep" values to only include actual changes
    const filteredUpdateData: any = {};
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== "keep") {
        filteredUpdateData[key] = value;
      }
    });

    const hasChanges = Object.keys(filteredUpdateData).length > 0;
    if (!hasChanges) {
      toast.error("Please make at least one change");
      return;
    }

    bulkUpdateMutation.mutate({
      accountId: emails[0]?.thread?.accountId || "",
      emailIds: Array.from(selectedEmails),
      ...filteredUpdateData,
    } as any);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "low":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unread":
        return <Eye className="h-4 w-4" />;
      case "read":
        return <EyeOff className="h-4 w-4" />;
      case "archived":
        return <Archive className="h-4 w-4" />;
      case "flagged":
        return <Flag className="h-4 w-4" />;
      case "snoozed":
        return <Clock className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Bulk Organize ({emails.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Email Organization</DialogTitle>
          <DialogDescription>
            Organize multiple emails at once. Select the emails you want to
            update and choose the changes to apply.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select Emails</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>Select All</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center gap-3 rounded border p-2 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedEmails.has(email.id)}
                      onCheckedChange={(checked) =>
                        handleSelectEmail(email.id, checked as boolean)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{email.subject}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        From: {email.from?.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {email.priority && (
                        <Badge
                          variant="outline"
                          className={getPriorityColor(email.priority)}
                        >
                          {email.priority}
                        </Badge>
                      )}
                      {email.status && (
                        <Badge variant="outline">
                          {getStatusIcon(email.status)}
                          {email.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                {selectedEmails.size} of {emails.length} emails selected
              </div>
            </CardContent>
          </Card>

          {/* Update Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Apply Changes</CardTitle>
              <CardDescription>
                Choose what changes to apply to the selected emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={updateData.categoryId || ""}
                  onValueChange={(value) =>
                    setUpdateData({ ...updateData, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep Current</SelectItem>
                    <SelectItem value="remove">Remove Category</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: category.color || "#6b7280",
                            }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={updateData.priority || ""}
                  onValueChange={(value) =>
                    setUpdateData({ ...updateData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep Current</SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-red-600" />
                        Urgent
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-orange-600" />
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-blue-600" />
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-gray-600" />
                        Low
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={updateData.status || ""}
                  onValueChange={(value) =>
                    setUpdateData({ ...updateData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep Current</SelectItem>
                    <SelectItem value="unread">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Unread
                      </div>
                    </SelectItem>
                    <SelectItem value="read">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Read
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        Archived
                      </div>
                    </SelectItem>
                    <SelectItem value="flagged">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        Flagged
                      </div>
                    </SelectItem>
                    <SelectItem value="snoozed">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Snoozed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Label>Quick Actions</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setUpdateData({ ...updateData, priority: "urgent" })
                    }
                    className="justify-start"
                  >
                    <Flag className="mr-2 h-4 w-4 text-red-600" />
                    Mark All Urgent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setUpdateData({ ...updateData, status: "flagged" })
                    }
                    className="justify-start"
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Flag All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setUpdateData({ ...updateData, status: "archived" })
                    }
                    className="justify-start"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setUpdateData({ ...updateData, status: "read" })
                    }
                    className="justify-start"
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    Mark All Read
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={bulkUpdateMutation.isPending || selectedEmails.size === 0}
            className="flex items-center gap-2"
          >
            {bulkUpdateMutation.isPending ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {bulkUpdateMutation.isPending
              ? "Updating..."
              : `Update ${selectedEmails.size} Email${selectedEmails.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
