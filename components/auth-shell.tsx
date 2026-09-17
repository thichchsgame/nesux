import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground md:grid md:grid-cols-2">
      <div className="nesux-grain relative hidden overflow-hidden border-r border-border md:block">
        <Image
          src="/editorial/concrete.png"
          alt=""
          fill
          sizes="50vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link
            href="/"
            className="font-hand text-xl font-bold tracking-[0.25em] text-foreground"
          >
            NEXUS
          </Link>
          <div>
            <p className="max-w-xs font-hand text-2xl font-bold uppercase leading-tight tracking-tight">
              Trang phục hệ thống cho đời sống thường nhật.
            </p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Est. 2026 / VN
            </p>
          </div>
        </div>
      </div>
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-5 md:hidden">
          <Link
            href="/"
            className="font-hand text-lg font-bold tracking-[0.25em] text-foreground"
          >
            NEXUS
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-16 md:px-16">
          {children}
        </div>
      </div>
    </main>
  );
}
