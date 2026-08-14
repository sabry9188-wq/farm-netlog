import Image from "next/image";
import { LoginForm } from "./login-form";
import { Waves } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <Image src="/farm-hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/80 via-ocean-950/85 to-ocean-950/95" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-aqua-500/15 ring-1 ring-aqua-400/40">
            <Waves className="size-7 text-aqua-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">NetLog</h1>
          <p className="mt-1 text-sm text-white/60">Cage Farm Net Inventory &amp; Lifecycle Management</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-white/40">
          Accounts are created by your farm Administrator. Contact them if you need access.
        </p>
      </div>
    </div>
  );
}
