import Image from "next/image";
import { LoginForm } from "./login-form";
import { Waves } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <Image src="/farm-hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      {/* Light shading only behind the title and footer text — the rest of the photo stays bright */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/45 to-transparent" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-aqua-500/20 ring-1 ring-aqua-400/50 backdrop-blur-sm">
            <Waves className="size-7 text-aqua-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white [text-shadow:_0_1px_6px_rgb(0_0_0_/_60%)]">NetLog</h1>
          <p className="mt-1 text-sm text-white/85 [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">Cage Farm Net Inventory &amp; Lifecycle Management</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-white/70 [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">
          Accounts are created by your farm Administrator. Contact them if you need access.
        </p>
      </div>
    </div>
  );
}
