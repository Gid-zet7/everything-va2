"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { useState } from "react";
import { toast } from "sonner";

export default function TestUserPage() {
  const { user, isAuthenticated } = useKindeAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testUserCreation = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/test-user");
      const data = await response.json();
      setResult(data);

      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to test user creation");
      }
    } catch (error) {
      console.error("Error testing user creation:", error);
      toast.error("Failed to test user creation");
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-user");
      const data = await response.json();
      setResult(data);

      if (response.ok) {
        toast.success("Database status checked");
      } else {
        toast.error("Failed to check database status");
      }
    } catch (error) {
      console.error("Error checking database status:", error);
      toast.error("Failed to check database status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>User Creation Test</CardTitle>
          <CardDescription>
            Test user creation and database connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Current User Info:</h3>
            {isAuthenticated ? (
              <div className="rounded-md bg-gray-50 p-4">
                <p>
                  <strong>ID:</strong> {user?.id}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Name:</strong> {user?.given_name} {user?.family_name}
                </p>
              </div>
            ) : (
              <p className="text-red-600">Not authenticated</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={testUserCreation}
              disabled={!isAuthenticated || loading}
            >
              {loading ? "Testing..." : "Test User Creation"}
            </Button>

            <Button
              onClick={checkDatabaseStatus}
              disabled={!isAuthenticated || loading}
              variant="outline"
            >
              Check Database Status
            </Button>
          </div>

          {result && (
            <div className="mt-4">
              <h3 className="mb-2 font-semibold">Result:</h3>
              <pre className="overflow-auto rounded-md bg-gray-50 p-4 text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">
              Troubleshooting:
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• If user creation fails, check your database connection</li>
              <li>
                • If webhook isn't working, verify the webhook URL in Kinde
                dashboard
              </li>
              <li>
                • The tRPC context now automatically creates users on first
                access
              </li>
              <li>• Check the server logs for webhook activity</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
