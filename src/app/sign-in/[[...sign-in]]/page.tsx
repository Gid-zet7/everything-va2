"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignInPage() {
  const handleSignIn = () => {
    // TODO: Implement authentication
    console.log("Sign in clicked");
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignIn} className="w-full">
            Sign In (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
