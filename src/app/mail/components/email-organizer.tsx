"use client";

import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Clock,
  Archive,
  Calendar,
  Users,
  Folder,
  DollarSign,
  Video,
  Settings,
  Play,
  Filter,
  Search,
  RefreshCw,
  CheckCircle,
  Flag,
  Eye,
  EyeOff,
  Mail,
  Reply,
} from "lucide-react";
import { toast } from "sonner";
import { RuleDialog } from "./rule-dialog";
import { ManualOrganizer } from "./manual-organizer";
import { BulkOrganizer } from "./bulk-organizer";
import { useAtom } from "jotai";
import { threadIdAtom } from "@/lib/atoms";

interface EmailOrganizerProps {
  accountId: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface EmailRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
}

export function EmailOrganizer({ accountId }: EmailOrganizerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useAtom(threadIdAtom);

  // Queries
  const { data: categories = [], refetch: refetchCategories } =
    api.mail.getEmailCategories.useQuery(
      { accountId },
      { enabled: !!accountId },
    );

  const { data: stats = [], refetch: refetchStats } =
    api.mail.getEmailStats.useQuery({ accountId }, { enabled: !!accountId });

  const { data: rules = [], refetch: refetchRules } =
    api.mail.getEmailRules.useQuery({ accountId }, { enabled: !!accountId });

  const {
    data: organizedEmails = [],
    refetch: refetchEmails,
    isLoading: emailsLoading,
  } = api.mail.getOrganizedEmails.useQuery(
    {
      accountId,
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
    },
    { enabled: !!accountId },
  );

  // Mutations
  const organizeEmailsMutation = api.mail.organizeEmails.useMutation({
    onSuccess: () => {
      toast.success("Emails organized successfully!");
      refetchCategories();
      refetchStats();
      refetchEmails();
      setIsOrganizing(false);
    },
    onError: (error) => {
      toast.error(`Failed to organize emails: ${error.message}`);
      setIsOrganizing(false);
    },
  });

  const getCategoryIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      "alert-circle": <AlertCircle className="h-4 w-4" />,
      clock: <Clock className="h-4 w-4" />,
      archive: <Archive className="h-4 w-4" />,
      calendar: <Calendar className="h-4 w-4" />,
      users: <Users className="h-4 w-4" />,
      folder: <Folder className="h-4 w-4" />,
      "dollar-sign": <DollarSign className="h-4 w-4" />,
      video: <Video className="h-4 w-4" />,
    };
    return iconMap[iconName || "folder"] || <Folder className="h-4 w-4" />;
  };

  const getCategoryColor = (color?: string) => {
    return color || "#6b7280";
  };

  const handleOrganizeEmails = async () => {
    setIsOrganizing(true);
    organizeEmailsMutation.mutate({
      accountId,
      autoClassify: true,
      createCategories: true,
      applyRules: true,
    });
  };

  const getCategoryStats = (categoryId: string) => {
    const stat = stats.find((stat) => (stat as any).categoryId === categoryId);
    return stat?._count &&
      typeof stat._count === "object" &&
      "id" in stat._count
      ? (stat._count as any).id
      : 0;
  };

  const getPriorityStats = (priority: string) => {
    const stat = stats.find((stat) => (stat as any).priority === priority);
    return stat?._count &&
      typeof stat._count === "object" &&
      "id" in stat._count
      ? (stat._count as any).id
      : 0;
  };

  const getStatusStats = (status: string) => {
    const stat = stats.find((stat) => (stat as any).status === status);
    return stat?._count &&
      typeof stat._count === "object" &&
      "id" in stat._count
      ? (stat._count as any).id
      : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Organizer</h2>
          <p className="text-muted-foreground">
            Automatically organize and categorize your emails
          </p>
        </div>
        <Button
          onClick={handleOrganizeEmails}
          disabled={isOrganizing}
          className="flex items-center gap-2"
        >
          {isOrganizing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isOrganizing ? "Organizing..." : "Organize Emails"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Emails
                </CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.reduce((sum, stat) => sum + stat._count.id, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  High Priority
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {getPriorityStats("high") + getPriorityStats("urgent")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {getStatusStats("unread")}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Email Categories</CardTitle>
              <CardDescription>
                Distribution of emails across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category: any) => {
                  const count = getCategoryStats(category.id);
                  const total = stats.reduce((sum, stat) => {
                    const count =
                      stat._count &&
                      typeof stat._count === "object" &&
                      "id" in stat._count
                        ? (stat._count as any).id
                        : 0;
                    return sum + count;
                  }, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;

                  return (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="rounded p-1"
                            style={{
                              backgroundColor:
                                getCategoryColor(category.color) + "20",
                            }}
                          >
                            {getCategoryIcon(category.icon)}
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {count} emails ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => {
                  setSelectedCategory(category.id);
                  setActiveTab("emails");
                  // Clear search when selecting a category
                  setSearchQuery("");
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-lg p-2"
                      style={{
                        backgroundColor:
                          getCategoryColor(category.color) + "20",
                      }}
                    >
                      {getCategoryIcon(category.icon)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {getCategoryStats(category.id)} emails
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails" className="space-y-6">
          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Email Filters</CardTitle>
                <div className="flex items-center gap-2">
                  {selectedCategory && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(null);
                        setSearchQuery("");
                      }}
                    >
                      Clear Filter
                    </Button>
                  )}
                  <BulkOrganizer
                    emails={organizedEmails}
                    onUpdate={() => {
                      refetchEmails();
                      refetchStats();
                    }}
                  />
                  <Button variant="outline" onClick={() => refetchEmails()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border py-2 pl-10 pr-4"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email List */}
          <Card>
            <CardHeader>
              <CardTitle>Organized Emails</CardTitle>
              <CardDescription>
                {organizedEmails.length} emails found • Click on any email to
                read and reply
                {selectedCategory && (
                  <span className="ml-2">
                    • Filtered by:{" "}
                    {categories.find((c) => c.id === selectedCategory)?.name}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {emailsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">
                      Loading emails...
                    </span>
                  </div>
                ) : organizedEmails.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">
                      {selectedCategory
                        ? "No emails in this category"
                        : "No emails found"}
                    </span>
                  </div>
                ) : (
                  organizedEmails.map((email: any) => (
                    <div
                      key={email.id}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                        selectedThreadId === email.thread?.id
                          ? "border-primary bg-muted"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedThreadId(email.thread?.id ?? undefined);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="truncate font-medium">
                              {email.subject}
                            </h3>
                            {email.priority === "urgent" && (
                              <Badge variant="destructive">Urgent</Badge>
                            )}
                            {email.priority === "high" && (
                              <Badge variant="secondary">High</Badge>
                            )}
                            {email.status === "unread" && (
                              <Badge variant="outline">Unread</Badge>
                            )}
                          </div>
                          <p className="mb-2 truncate text-sm text-muted-foreground">
                            From: {email.from?.address}
                          </p>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {email.bodySnippet?.substring(0, 150)}...
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          {email.category && (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: getCategoryColor(
                                  email.category.color,
                                ),
                                color: getCategoryColor(email.category.color),
                              }}
                            >
                              {email.category.name}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedThreadId(
                                  email.thread?.id ?? undefined,
                                );
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <ManualOrganizer
                              email={email}
                              onUpdate={() => {
                                refetchEmails();
                                refetchStats();
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Email Rules</h3>
            <RuleDialog
              accountId={accountId}
              onSuccess={() => {
                refetchRules();
              }}
            />
          </div>

          <div className="space-y-4">
            {rules.map((rule: any) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">Priority: {rule.priority}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      {rule.isActive ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
