import Image from "next/image";
import { Waves } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="theme-light flex min-h-screen w-full items-center justify-center bg-white">
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-16">
        <Image src="/login-hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/70 via-ocean-950/55 to-ocean-950/80" />

        <div className="relative z-10 flex w-full flex-col items-center">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-aqua-500/20 ring-1 ring-aqua-400/50 backdrop-blur-sm">
              <Waves className="size-7 text-aqua-400" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white [text-shadow:_0_1px_6px_rgb(0_0_0_/_60%)] sm:text-3xl">
              Reset your password
            </h1>
            <p className="mt-1 max-w-xs text-sm text-white/90 [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
