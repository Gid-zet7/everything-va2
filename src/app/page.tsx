import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { getKindeServerSession } from "@/lib/kinde";
import {
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import Image from "next/image";
import DotGrid from "@/components/dot-grid";
import CardSwap, { Card } from "@/components/card-swap";
import SpotlightCard from "@/components/spotlight-card";
import PillNav from "@/components/pill-nav";
const logo = "/logo.png";
import { BentoGridThirdDemo } from "@/components/bento";
import StarBorder from "@/components/star-border";
import { WorldMapDemo } from "@/components/map";
import Marquee from "@/components/marquee";
import VideoMarquee from "@/components/videomarquee";
import LogoLoop from "@/components/logo-loop";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiGmail,
  SiGooglecalendar,
} from "react-icons/si";

// const sampleEvents: CalendarEvent[] = [
//   {
//     id: "1",
//     title: "Annual Planning",
//     description: "Strategic planning for next year",
//     start: subDays(new Date(), 24), // 24 days before today
//     end: subDays(new Date(), 23), // 23 days before today
//     allDay: true,
//     color: "sky",
//     location: "Main Conference Hall",
//   },
//   {
//     id: "2",
//     title: "Project Deadline",
//     description: "Submit final deliverables",
//     start: setMinutes(setHours(subDays(new Date(), 9), 13), 0), // 1:00 PM, 9 days before
//     end: setMinutes(setHours(subDays(new Date(), 9), 15), 30), // 3:30 PM, 9 days before
//     color: "amber",
//     location: "Office",
//   },
//   {
//     id: "3",
//     title: "Quarterly Budget Review",
//     description: "Strategic planning for next year",
//     start: subDays(new Date(), 13), // 13 days before today
//     end: subDays(new Date(), 13), // 13 days before today
//     allDay: true,
//     color: "orange",
//     location: "Main Conference Hall",
//   },
//   {
//     id: "4",
//     title: "Team Meeting",
//     description: "Weekly team sync",
//     start: setMinutes(setHours(new Date(), 10), 0), // 10:00 AM today
//     end: setMinutes(setHours(new Date(), 11), 0), // 11:00 AM today
//     color: "sky",
//     location: "Conference Room A",
//   },
//   {
//     id: "5",
//     title: "Lunch with Client",
//     description: "Discuss new project requirements",
//     start: setMinutes(setHours(addDays(new Date(), 1), 12), 0), // 12:00 PM, 1 day from now
//     end: setMinutes(setHours(addDays(new Date(), 1), 13), 15), // 1:15 PM, 1 day from now
//     color: "emerald",
//     location: "Downtown Cafe",
//   },
//   {
//     id: "6",
//     title: "Product Launch",
//     description: "New product release",
//     start: addDays(new Date(), 3), // 3 days from now
//     end: addDays(new Date(), 6), // 6 days from now
//     allDay: true,
//     color: "violet",
//   },
//   {
//     id: "7",
//     title: "Sales Conference",
//     description: "Discuss about new clients",
//     start: setMinutes(setHours(addDays(new Date(), 4), 14), 30), // 2:30 PM, 4 days from now
//     end: setMinutes(setHours(addDays(new Date(), 5), 14), 45), // 2:45 PM, 5 days from now
//     color: "rose",
//     location: "Downtown Cafe",
//   },
//   {
//     id: "8",
//     title: "Team Meeting",
//     description: "Weekly team sync",
//     start: setMinutes(setHours(addDays(new Date(), 5), 9), 0), // 9:00 AM, 5 days from now
//     end: setMinutes(setHours(addDays(new Date(), 5), 10), 30), // 10:30 AM, 5 days from now
//     color: "orange",
//     location: "Conference Room A",
//   },
//   {
//     id: "9",
//     title: "Review contracts",
//     description: "Weekly team sync",
//     start: setMinutes(setHours(addDays(new Date(), 5), 14), 0), // 2:00 PM, 5 days from now
//     end: setMinutes(setHours(addDays(new Date(), 5), 15), 30), // 3:30 PM, 5 days from now
//     color: "sky",
//     location: "Conference Room A",
//   },
//   {
//     id: "10",
//     title: "Team Meeting",
//     description: "Weekly team sync",
//     start: setMinutes(setHours(addDays(new Date(), 5), 9), 45), // 9:45 AM, 5 days from now
//     end: setMinutes(setHours(addDays(new Date(), 5), 11), 0), // 11:00 AM, 5 days from now
//     color: "amber",
//     location: "Conference Room A",
//   },
//   {
//     id: "11",
//     title: "Marketing Strategy Session",
//     description: "Quarterly marketing planning",
//     start: setMinutes(setHours(addDays(new Date(), 9), 10), 0), // 10:00 AM, 9 days from now
//     end: setMinutes(setHours(addDays(new Date(), 9), 15), 30), // 3:30 PM, 9 days from now
//     color: "emerald",
//     location: "Marketing Department",
//   },
//   {
//     id: "12",
//     title: "Annual Shareholders Meeting",
//     description: "Presentation of yearly results",
//     start: addDays(new Date(), 17), // 17 days from now
//     end: addDays(new Date(), 17), // 17 days from now
//     allDay: true,
//     color: "sky",
//     location: "Grand Conference Center",
//   },
//   {
//     id: "13",
//     title: "Product Development Workshop",
//     description: "Brainstorming for new features",
//     start: setMinutes(setHours(addDays(new Date(), 26), 9), 0), // 9:00 AM, 26 days from now
//     end: setMinutes(setHours(addDays(new Date(), 27), 17), 0), // 5:00 PM, 27 days from now
//     color: "rose",
//     location: "Innovation Lab",
//   },
// ]

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
        logo={logo}
        logoAlt="EverythingVA Logo"
        items={[
          { label: "Home", href: "/" },
          { label: "Features", href: "#features" },
          { label: "Demo", href: "#demo" },
          { label: "Get Started", href: "/api/auth/register" },
        ]}
        activeHref="/"
        className="custom-nav"
        ease="power2.easeOut"
        baseColor="hsl(var(--foreground))"
        pillColor="hsl(var(--background))"
        hoveredPillTextColor="hsl(var(--background))"
        pillTextColor="hsl(var(--foreground))"
      />

      {/* Hero Section with DotGrid */}
      <div className="relative h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute inset-0">
          <DotGrid className="h-full w-full" baseColor="#6b7280" activeColor="#3b82f6" gap={18} dotSize={2} />
        </div>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 top-24 text-red-500/70 [animation:floatY_8s_ease-in-out_infinite]">
            <SiGmail className="h-8 w-8 md:h-12 md:w-12" />
          </div>
          <div className="absolute right-12 bottom-28 text-blue-500/70 [animation:floatY_10s_ease-in-out_infinite] [animation-delay:2s]">
            <SiGooglecalendar className="h-8 w-8 md:h-12 md:w-12" />
          </div>
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
          <div className="max-w-4xl px-4">
            <div className="mb-8 inline-flex items-center rounded-full border border-border/50 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur-sm">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="mr-1">✨</span>
              AI-Powered Email Management
            </div>

            <h1 className="mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-4xl font-bold text-transparent md:text-5xl lg:text-6xl">
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

            <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button
                size="lg"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <RegisterLink>
                  <span className="relative z-10">Get Started</span>
                </RegisterLink>
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
              className="group transition-all duration-300 hover:scale-105"
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
              className="group transition-all duration-300 hover:scale-105"
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
              className="group transition-all duration-300 hover:scale-105"
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
          <div className="mt-44 mb-6 text-center">
            <h2 className="text-4xl font-extrabold text-foreground mb-2">Workload? Consider it Handled.</h2>
            <p className="text-lg text-muted-foreground">See how your stress melts away—let us take the heavy lifting!</p>
          </div>
          <VideoMarquee />

          {/* Interactive Card Swap Section */}
          <div className="mb-20 text-center">
            {/* <h3 className="mb-12 text-3xl font-semibold text-foreground">
              See EverythingVA in action
            </h3> */}
            <div className="flex justify-center items-center">
              <div className="mt-40 text-left">
              <Image src="/folder.png" alt="Email Organizer" width={30} height={30} className="inline-block mr-2 mb-4" />
                <h3 className="text-4xl font-bold md:text-5xl text-foreground">
                  Email Organizer 
                </h3>
                <p className="text-muted-foreground text-lg">
                  Automatically organize and categorize your emails
                </p>
              </div>
              
              <div className="h-96 w-full max-w-4xl overflow-hidden rounded-2xl">
                <CardSwap
                  cardDistance={60}
                  verticalDistance={70}
                  delay={5000}
                  pauseOnHover={false}
                >
                <Card className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50">
                  <div className="p-8 text-center">
                    <h3 className="mb-4 text-2xl font-bold text-blue-900 dark:text-blue-100">
                      Overview
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300">
                      Overview of your inbox
                    </p>
                    <div className="mb-4 flex w-full items-center justify-center">
                    
                      <Image
                        src="/categories.svg"
                        alt="Smart categories"
                        width={600}
                        height={300}
                        className="h-72 w-auto"
                      />
                    </div>
                    
                  </div>
                </Card>
                <Card className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/50">
                  <div className="p-8 text-center">
                    <h3 className="mb-4 text-2xl font-bold text-green-900 dark:text-green-100">
                      Smart Categories
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      Smart categories that work for you
                    </p>
                    <div className="mb-4 flex w-full items-center justify-center">
                      <Image
                        src="/full-categories.svg"
                        alt="Smart categories"
                        width={600}
                        height={300}
                        className="h-72 w-auto"
                      />
                    </div>
                  </div>
                </Card>
                <Card className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950/50 dark:to-orange-950/50">
                  <div className="p-8 text-center">
                    <h3 className="mb-4 text-2xl font-bold text-amber-900 dark:text-amber-100">
                      Email Rule
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300">
                      Create email rules to automatically organize your emails
                    </p>
                    <div className="mb-4 flex w-full items-center justify-center">
                      <Image
                        src="/emailrule.png"
                        alt="Email rule"
                        width={600}
                        height={300}
                        className="h-72 w-auto"
                      />
                    </div>
                  </div>
                </Card>
                </CardSwap>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div id="demo" className="relative z-[10] bg-muted/30 py-24 mt-40">
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

      {/* Testimonials Marquee Section */}
      <div className="relative z-[10] bg-background py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              Loved by users worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              🌟 See what our community has to say about EverythingVA
            </p>
          </div>
          <Marquee />
        </div>
      </div>

      {/* Magic Bento Section */}
      <div className="relative z-[10] bg-background py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              Because Emails Shouldn't Stress You Out
            </h2>
            <p className="text-xl text-muted-foreground">
              🔮 Experience the future of email management
            </p>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:bg-card/70">
            <BentoGridThirdDemo />
          </div>
        </div>
      </div>

      {/* Footer: World Map */}
      <footer className="relative z-[10] overflow-hidden bg-background">
        <div className="absolute inset-0 pointer-events-none" />
        <div className="relative">
          <WorldMapDemo />
        </div>
        <div className="relative -mt-24 pb-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 p-6 md:p-8">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-semibold text-foreground">Ready to transform your email experience?</h3>
                  <p className="text-muted-foreground mt-1">Join thousands who already use EverythingVA.</p>
                </div>
                <div className="flex items-center gap-3">
                  <StarBorder
                    as="button"
                    className="group rounded-xl px-6 py-3 font-semibold text-magenta-600 transition-all duration-300 hover:scale-105"
                    color="magenta"
                    speed="5s"
                  >
                    Get Started
                  </StarBorder>
                  <ModeToggle />
                  {/* <Button variant="outline" className="rounded-xl">
                    <Link href="https://start-saas.com?utm=normalhuman">Learn More</Link>
                  </Button> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
