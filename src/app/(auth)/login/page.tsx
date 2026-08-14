import Image from "next/image";
import { Clock, Anchor, BellRing, Wrench, FileBarChart, Waves } from "lucide-react";
import { LoginForm } from "./login-form";

const FEATURES = [
  { icon: Clock, label: "Track Every Net\nin Real-Time" },
  { icon: Anchor, label: "Manage Cage\nInstallations" },
  { icon: BellRing, label: "Get 60-Day\nChange Alerts" },
  { icon: Wrench, label: "Log Cleaning\n& Repairs" },
  { icon: FileBarChart, label: "Generate Farm\nReports" },
] as const;

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Hero: full-window farm photo with the login form on top */}
      <div className="relative flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden px-4 pt-16 pb-24 sm:min-h-[640px]">
        <Image src="/login-hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/70 via-ocean-950/55 to-ocean-950/80" />

        <div className="relative z-10 flex w-full flex-col items-center">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-aqua-500/20 ring-1 ring-aqua-400/50 backdrop-blur-sm">
              <Waves className="size-7 text-aqua-400" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white [text-shadow:_0_1px_6px_rgb(0_0_0_/_60%)] sm:text-3xl">
              NetLog
            </h1>
            <p className="mt-1 text-sm text-white/90 [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">
              Cage Farm Net Inventory &amp; Lifecycle Management
            </p>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
            <LoginForm />
          </div>
          <p className="mt-6 max-w-sm text-center text-xs text-white/80 [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">
            Accounts are created by your farm Administrator. Contact them if you need access.
          </p>
        </div>

        {/* Wave divider into the white section below */}
        <svg
          className="absolute inset-x-0 bottom-0 h-20 w-full text-white sm:h-28"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,40 C360,110 1080,0 1440,55 L1440,120 L0,120 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Feature strip */}
      <div className="relative bg-white px-4 pt-10 pb-16 sm:pb-24">
        <h2 className="mx-auto max-w-3xl text-center text-xl font-bold text-foreground sm:text-2xl">
          With your NetLog account you&apos;ll be able to:
        </h2>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-aqua-500/10 text-aqua-500">
                <Icon className="size-8" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-semibold whitespace-pre-line text-foreground/80">{label}</p>
            </div>
          ))}
        </div>

        {/* Wave divider into the navy footer band */}
        <svg
          className="absolute inset-x-0 bottom-0 h-16 w-full text-ocean-950"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,70 C480,10 960,90 1440,20 L1440,100 L0,100 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Closing navy band */}
      <div className="flex h-20 items-center justify-center bg-ocean-950">
        <p className="text-xs font-medium text-white/60">NetLog · Station-05 &amp; Offshore Cage Farms</p>
      </div>
    </div>
  );
}
