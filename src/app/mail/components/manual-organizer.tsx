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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Tag,
  Flag,
  Archive,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  CheckCircle,
  X,
  Plus,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface ManualOrganizerProps {
  email: any;
  onUpdate?: () => void;
}

interface EmailUpdateData {
  categoryId?: string;
  priority?: string;
  status?: string;
  customLabels?: string[];
  notes?: string;
}

export function ManualOrganizer({ email, onUpdate }: ManualOrganizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [updateData, setUpdateData] = useState<EmailUpdateData>({
    categoryId: email.categoryId || "",
    priority: email.priority || "medium",
    status: email.status || "unread",
    customLabels: email.customLabels || [],
    notes: "",
  });
  const [newLabel, setNewLabel] = useState("");

  const { data: categories = [] } = api.mail.getEmailCategories.useQuery(
    { accountId: email.thread?.accountId || "" },
    { enabled: !!email.thread?.accountId },
  );

  const updateEmailMutation = api.mail.updateEmailOrganization.useMutation({
    onSuccess: () => {
      toast.success("Email organization updated successfully!");
      setIsOpen(false);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(`Failed to update email: ${error.message}`);
    },
  });

  const handleSave = () => {
    const mutationData: any = {
      emailId: email.id,
      accountId: email.thread?.accountId || "",
      ...updateData,
    };

    // Handle "none" value for categoryId
    if (mutationData.categoryId === "none") {
      mutationData.categoryId = undefined;
    }

    updateEmailMutation.mutate(mutationData);
  };

  const addLabel = () => {
    if (
      newLabel.trim() &&
      !updateData.customLabels?.includes(newLabel.trim())
    ) {
      setUpdateData({
        ...updateData,
        customLabels: [...(updateData.customLabels || []), newLabel.trim()],
      });
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    setUpdateData({
      ...updateData,
      customLabels: updateData.customLabels?.filter((l) => l !== label) || [],
    });
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
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Organize Email</DialogTitle>
          <DialogDescription>
            Manually organize and categorize this email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{email.subject}</p>
                <p className="text-sm text-muted-foreground">
                  From: {email.from?.address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {email.bodySnippet?.substring(0, 200)}...
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={updateData.categoryId}
              onValueChange={(value) =>
                setUpdateData({ ...updateData, categoryId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color || "#6b7280" }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={updateData.priority}
              onValueChange={(value) =>
                setUpdateData({ ...updateData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={updateData.status}
              onValueChange={(value) =>
                setUpdateData({ ...updateData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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

          {/* Custom Labels */}
          <div className="space-y-2">
            <Label>Custom Labels</Label>
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add a custom label..."
                onKeyPress={(e) => e.key === "Enter" && addLabel()}
              />
              <Button variant="outline" size="sm" onClick={addLabel}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {updateData.customLabels?.map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {label}
                  <button
                    onClick={() => removeLabel(label)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={updateData.notes}
              onChange={(e) =>
                setUpdateData({ ...updateData, notes: e.target.value })
              }
              placeholder="Add personal notes about this email..."
              rows={3}
            />
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
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
                  Mark Urgent
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
                  Flag Email
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
                  Archive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setUpdateData({ ...updateData, status: "snoozed" })
                  }
                  className="justify-start"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Snooze
                </Button>
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
            disabled={updateEmailMutation.isPending}
            className="flex items-center gap-2"
          >
            {updateEmailMutation.isPending ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updateEmailMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
