"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignUpPage() {
  const handleSignUp = () => {
    // TODO: Implement authentication
    console.log("Sign up clicked");
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignUp} className="w-full">
            Sign Up (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
