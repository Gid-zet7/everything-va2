"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Settings } from "lucide-react";
import { toast } from "sonner";

interface RuleDialogProps {
  accountId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  value: string;
}

export function RuleDialog({ accountId, trigger, onSuccess }: RuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("0");
  const [conditions, setConditions] = useState<Condition[]>([
    { field: "subject", operator: "contains", value: "" },
  ]);
  const [actions, setActions] = useState<Action[]>([
    { type: "categorize", value: "actionRequired" },
  ]);

  const createRuleMutation = api.mail.createEmailRule.useMutation({
    onSuccess: () => {
      toast.success("Rule created successfully!");
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setPriority("0");
    setConditions([{ field: "subject", operator: "contains", value: "" }]);
    setActions([{ type: "categorize", value: "actionRequired" }]);
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: "subject", operator: "contains", value: "" },
    ]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const updateCondition = (
    index: number,
    field: keyof Condition,
    value: string,
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const addAction = () => {
    setActions([...actions, { type: "categorize", value: "actionRequired" }]);
  };

  const removeAction = (index: number) => {
    if (actions.length > 1) {
      setActions(actions.filter((_, i) => i !== index));
    }
  };

  const updateAction = (index: number, field: keyof Action, value: string) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Rule name is required");
      return;
    }

    if (conditions.some((c) => !c.value.trim())) {
      toast.error("All condition values are required");
      return;
    }

    if (actions.some((a) => !a.value.trim())) {
      toast.error("All action values are required");
      return;
    }

    createRuleMutation.mutate({
      accountId,
      name: name.trim(),
      description: description.trim(),
      conditions,
      actions,
      priority: parseInt(priority),
    });
  };

  const fieldOptions = [
    { value: "subject", label: "Subject" },
    { value: "from", label: "From" },
    { value: "to", label: "To" },
    { value: "body", label: "Body" },
    { value: "hasAttachments", label: "Has Attachments" },
  ];

  const operatorOptions = [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "startsWith", label: "Starts with" },
    { value: "endsWith", label: "Ends with" },
    { value: "regex", label: "Regex" },
    { value: "not", label: "Does not contain" },
  ];

  const actionTypeOptions = [
    { value: "categorize", label: "Categorize" },
    { value: "setPriority", label: "Set Priority" },
    { value: "setStatus", label: "Set Status" },
    { value: "addLabel", label: "Add Label" },
  ];

  const categoryOptions = [
    { value: "actionRequired", label: "Action Required" },
    { value: "waitingOn", label: "Waiting On" },
    { value: "reference", label: "Reference / Archive" },
    { value: "somedayLater", label: "Someday / Later" },
    { value: "clients", label: "Clients" },
    { value: "projects", label: "Projects" },
    { value: "finance", label: "Finance" },
    { value: "meetings", label: "Meetings" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const statusOptions = [
    { value: "unread", label: "Unread" },
    { value: "read", label: "Read" },
    { value: "archived", label: "Archived" },
    { value: "flagged", label: "Flagged" },
    { value: "snoozed", label: "Snoozed" },
  ];

  const getActionValueOptions = (actionType: string) => {
    switch (actionType) {
      case "categorize":
        return categoryOptions;
      case "setPriority":
        return priorityOptions;
      case "setStatus":
        return statusOptions;
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Create Rule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Email Rule</DialogTitle>
          <DialogDescription>
            Create a rule to automatically organize your emails based on
            conditions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., High Priority Clients"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Low</SelectItem>
                  <SelectItem value="1">Medium</SelectItem>
                  <SelectItem value="2">High</SelectItem>
                  <SelectItem value="3">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule does..."
              rows={2}
            />
          </div>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conditions</CardTitle>
                <Button variant="outline" size="sm" onClick={addCondition}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={condition.field}
                    onValueChange={(value) =>
                      updateCondition(index, "field", value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value) =>
                      updateCondition(index, "operator", value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(index, "value", e.target.value)
                    }
                    placeholder="Value..."
                    className="flex-1"
                  />

                  {conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Actions</CardTitle>
                <Button variant="outline" size="sm" onClick={addAction}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Action
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={action.type}
                    onValueChange={(value) =>
                      updateAction(index, "type", value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={action.value}
                    onValueChange={(value) =>
                      updateAction(index, "value", value)
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getActionValueOptions(action.type).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {actions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Rule Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>If</strong>{" "}
                  {conditions.map((c, i) => (
                    <span key={i}>
                      {i > 0 && " AND "}
                      {c.field} {c.operator} "{c.value}"
                    </span>
                  ))}
                </p>
                <p className="text-sm">
                  <strong>Then</strong>{" "}
                  {actions.map((a, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      {a.type} = {a.value}
                    </span>
                  ))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createRuleMutation.isLoading}
          >
            {createRuleMutation.isLoading ? "Creating..." : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
