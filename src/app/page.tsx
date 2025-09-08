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
import CardSwap, { Card } from "@/components/card-swap";
import SpotlightCard from "@/components/spotlight-card";
import PillNav from "@/components/pill-nav";
import logo from "../../public/logo.png";
import MagicBento from "@/components/magic-bento";
import StarBorder from "@/components/star-border";

import LogoLoop from "@/components/logo-loop";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
} from "react-icons/si";

const techLogos = [
  { node: <SiReact />, title: "React", href: "https://react.dev" },
  { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
  {
    node: <SiTypescript />,
    title: "TypeScript",
    href: "https://www.typescriptlang.org",
  },
  {
    node: <SiTailwindcss />,
    title: "Tailwind CSS",
    href: "https://tailwindcss.com",
  },
];

// Alternative with image sources
const imageLogos = [
  {
    src: "/logos/company1.png",
    alt: "Company 1",
    href: "https://company1.com",
  },
  {
    src: "/logos/company2.png",
    alt: "Company 2",
    href: "https://company2.com",
  },
  {
    src: "/logos/company3.png",
    alt: "Company 3",
    href: "https://company3.com",
  },
];

const LandingPage = async () => {
  const { getUser } = await getKindeServerSession();
  const user = await getUser();
  // if (user?.id) {

  //   return redirect("/mail");
  // }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <PillNav
        logo={logo.src}
        logoAlt="EverythingVA Logo"
        items={[
          { label: "Home", href: "/" },
          { label: "Features", href: "#features" },
          { label: "Demo", href: "#demo" },
          { label: "Get Started", href: "/mail" },
        ]}
        activeHref="/"
        className="custom-nav"
        ease="power2.easeOut"
        baseColor="hsl(var(--foreground))"
        pillColor="hsl(var(--background))"
        hoveredPillTextColor="hsl(var(--background))"
        pillTextColor="hsl(var(--foreground))"
      />

      {/* Hero Section with RippleGrid */}
      <div className="relative h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <div className="bg-grid-foreground absolute inset-0 overflow-hidden bg-[size:50px_50px]" />
        <RippleGrid
          enableRainbow={false}
          gridColor="hsl(var(--muted-foreground))"
          rippleIntensity={0.05}
          gridSize={10}
          gridThickness={15}
          fadeDistance={100}
          glowIntensity={0.1}
          mouseInteraction={true}
          mouseInteractionRadius={1.2}
          opacity={0.3}
        >
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="relative z-10 max-w-4xl px-4">
              <div className="mb-8 inline-flex items-center rounded-full border border-border/50 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur-sm">
                <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="mr-1">✨</span>
                AI-Powered Email Management
              </div>

              <h1 className="mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-6xl font-bold text-transparent md:text-7xl lg:text-8xl">
                The minimalistic, <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  AI-powered
                </span>{" "}
                email client.
              </h1>

              <p className="mb-8 max-w-2xl text-center text-xl text-muted-foreground">
                EverythingVA is a minimalistic, AI-powered email client that
                empowers you to manage your email with ease.
              </p>

              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button
                  size="lg"
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Button>

                <Link href="https://start-saas.com?utm=normalhuman">
                  <Button
                    variant="outline"
                    size="lg"
                    className="group rounded-xl border-2 border-border bg-background/50 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary hover:bg-background"
                  >
                    <span className="mr-2">Learn More</span>
                    <svg
                      className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </RippleGrid>
      </div>

      {/* Technology Partners Section */}
      <div className="relative bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-lg font-medium text-muted-foreground">
              🚀 Built with modern technology
            </h2>
          </div>
          <div className="h-24 overflow-hidden rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm transition-colors duration-300 hover:border-border/50">
            <LogoLoop
              logos={techLogos}
              speed={120}
              direction="left"
              logoHeight={48}
              gap={40}
              pauseOnHover
              scaleOnHover
              fadeOut
              fadeOutColor="hsl(var(--background))"
              ariaLabel="Technology partners"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-[10] bg-background py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              Experience the power of:
            </h2>
            <p className="text-xl text-muted-foreground">
              🎯 Cutting-edge features designed for modern productivity
            </p>
          </div>

          {/* Feature Cards with SpotlightCard */}
          <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-3">
            <SpotlightCard
              className="group rounded-2xl border border-border/50 bg-card p-8 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              spotlightColor="rgba(59, 130, 246, 0.1)"
            >
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 transition-colors duration-300 dark:bg-blue-900/20">
                  <svg
                    className="h-10 w-10 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-semibold text-foreground">
                  AI-driven email RAG
                </h3>
                <p className="text-muted-foreground">
                  Automatically prioritize your emails with our advanced AI
                  system that understands context and importance.
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard
              className="group rounded-2xl border border-border/50 bg-card p-8 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              spotlightColor="rgba(34, 197, 94, 0.1)"
            >
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-100 transition-colors duration-300 dark:bg-green-900/20">
                  <svg
                    className="h-10 w-10 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-semibold text-foreground">
                  Full-text search
                </h3>
                <p className="text-muted-foreground">
                  Quickly find any email with our powerful search functionality
                  that indexes every word and attachment.
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard
              className="group rounded-2xl border border-border/50 bg-card p-8 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              spotlightColor="rgba(245, 158, 11, 0.1)"
            >
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 transition-colors duration-300 dark:bg-amber-900/20">
                  <svg
                    className="h-10 w-10 text-amber-600 dark:text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-semibold text-foreground">
                  Shortcut-focused interface
                </h3>
                <p className="text-muted-foreground">
                  Navigate your inbox efficiently with our intuitive keyboard
                  shortcuts designed for power users.
                </p>
              </div>
            </SpotlightCard>
          </div>

          {/* Interactive Card Swap Section */}
          <div className="mb-20 text-center">
            <h3 className="mb-12 text-3xl font-semibold text-foreground">
              See EverythingVA in action
            </h3>
            <div className="h-96 overflow-hidden rounded-2xl">
              <CardSwap
                cardDistance={60}
                verticalDistance={70}
                delay={5000}
                pauseOnHover={false}
              >
                <Card className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50">
                  <div className="p-8 text-center">
                    <h3 className="mb-4 text-2xl font-bold text-blue-900 dark:text-blue-100">
                      Smart Inbox
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300">
                      AI-powered email prioritization that learns from your
                      behavior
                    </p>
                  </div>
                </Card>
                <Card className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/50">
                  <div className="p-8 text-center">
                    <h3 className="mb-4 text-2xl font-bold text-green-900 dark:text-green-100">
                      Lightning Fast
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      Built with Next.js 14 and optimized for speed
                    </p>
                  </div>
                </Card>
                <Card className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950/50 dark:to-orange-950/50">
                  <div className="p-8 text-center">
                    <h3 className="mb-4 text-2xl font-bold text-amber-900 dark:text-amber-100">
                      Keyboard First
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300">
                      Navigate your inbox without touching the mouse
                    </p>
                  </div>
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div id="demo" className="relative z-[10] bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-12 text-4xl font-bold text-foreground md:text-5xl">
            See EverythingVA in action
          </h2>
          <div className="hover:shadow-3xl group relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border/50 bg-card shadow-2xl transition-all duration-500">
            <Image
              src="/demo2.png"
              alt="EverythingVA Demo"
              width={1000}
              height={1000}
              className="h-auto w-full transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        </div>
      </div>

      {/* Magic Bento Section */}
      <div className="relative z-[10] bg-background py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              Built with cutting-edge technology
            </h2>
            <p className="text-xl text-muted-foreground">
              🔮 Experience the future of email management
            </p>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:bg-card/70">
            <MagicBento
              textAutoHide={true}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              spotlightRadius={300}
              particleCount={12}
              glowColor="59, 130, 246"
            />
          </div>
        </div>
      </div>

      {/* CTA Section with StarBorder */}
      <div className="relative z-[10] overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 py-24">
        <div className="bg-grid-white/[0.1] dark:bg-grid-black/[0.1] absolute inset-0 overflow-hidden bg-[size:50px_50px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">
            Ready to transform your email experience?
          </h2>
          <p className="mb-12 text-xl text-blue-100">
            Join thousands of users who've already discovered the power of
            EverythingVA
          </p>

          <div className="mb-12 flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <StarBorder
              as="button"
              className="group rounded-xl bg-white px-8 py-4 font-semibold text-blue-600 transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-xl"
              color="white"
              speed="5s"
            >
              <span className="mr-2">Get Started Now</span>
              <svg
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </StarBorder>

            <Button
              variant="outline"
              size="lg"
              className="rounded-xl border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-white hover:text-blue-600"
            >
              <Link href="https://start-saas.com?utm=normalhuman">
                Learn More
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <LoginLink>
              <Button
                variant="outline"
                className="rounded-xl border-white bg-transparent text-white transition-all duration-300 hover:bg-white hover:text-blue-600"
              >
                Sign In
              </Button>
            </LoginLink>
            <RegisterLink>
              <Button className="rounded-xl bg-white text-blue-600 transition-all duration-300 hover:bg-gray-100">
                Sign Up
              </Button>
            </RegisterLink>
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
