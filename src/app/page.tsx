import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { getKindeServerSession } from "@/lib/kinde";
import { redirect } from "next/navigation";
import {
  RegisterLink,
  LoginLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import Image from "next/image";
import RippleGrid from "@/components/hero-background";

const LandingPage = async () => {
  const { getUser } = await getKindeServerSession();
  const user = await getUser();
  // if (user?.id) {

  //   return redirect("/mail");
  // }
  return (
    <>
      {/* <div className="h-screen w-full bg-white absolute inset-0">
            </div> */}
      <div
        style={{ position: "relative", height: "100vh", overflow: "hidden" }}
      >
        <RippleGrid
          enableRainbow={false}
          gridColor="#ffffff"
          rippleIntensity={0.05}
          gridSize={10}
          gridThickness={15}
          mouseInteraction={true}
          mouseInteractionRadius={1.2}
          opacity={0.8}
        >
          <div className="flex flex-col items-center text-center">
            <h1 className="inline-block bg-gradient-to-r from-gray-600 to-gray-900 bg-clip-text text-center text-6xl font-bold text-transparent">
              The minimalistic, <br />
              AI-powered email client.
            </h1>
            <div className="h-4"></div>
            <p className="mb-8 max-w-xl text-center text-xl text-gray-600">
              EverythingVA is a minimalistic, AI-powered email client that
              empowers you to manage your email with ease.
            </p>
            <div className="space-x-4">
              <Button>
                <Link href="/mail">Get Started</Link>
              </Button>
              <Link href="https://start-saas.com?utm=normalhuman">
                <Button variant="outline">Learn More</Button>
              </Link>
            </div>
          </div>
        </RippleGrid>
      </div>
      {/* <div className="absolute bottom-0 left-0 right-0 top-0 z-[-1] bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_80%)]"></div> */}
      <div className="relative z-[10] flex min-h-screen flex-col items-center pt-20">
        <div className="mx-auto mt-12 max-w-5xl">
          <h2 className="mb-4 text-center text-2xl font-semibold">
            Experience the power of:
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 shadow-md">
              <h3 className="mb-2 text-xl font-semibold">
                AI-driven email RAG
              </h3>
              <p className="text-gray-600">
                Automatically prioritize your emails with our advanced AI
                system.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-md">
              <h3 className="mb-2 text-xl font-semibold">Full-text search</h3>
              <p className="text-gray-600">
                Quickly find any email with our powerful search functionality.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-md">
              <h3 className="mb-2 text-xl font-semibold">
                Shortcut-focused interface
              </h3>
              <p className="text-gray-600">
                Navigate your inbox efficiently with our intuitive keyboard
                shortcuts.
              </p>
            </div>
          </div>
        </div>
        <Image
          src="/demo2.png"
          alt="demo"
          width={1000}
          height={1000}
          className="my-12 h-auto w-[70vw] rounded-md border shadow-xl transition-all hover:scale-[102%] hover:shadow-2xl"
        />
        <div className="mb-10 flex items-center space-x-4">
          <LoginLink>
            <Button>Sign In</Button>
          </LoginLink>
          <RegisterLink>
            <Button>Sign Up</Button>
          </RegisterLink>
          <ModeToggle />
        </div>
      </div>
    </>
  );
};

export default LandingPage;
