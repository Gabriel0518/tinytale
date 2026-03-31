"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  navRight?: React.ReactNode;
  mobileHeader?: React.ReactNode;
  contentClassName?: string;
  hideFooterOnMobile?: boolean;
}

export function AuthLayout({
  children,
  navRight,
  mobileHeader,
  contentClassName,
  hideFooterOnMobile = false,
}: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#0F1014]">
      <div className="pointer-events-none absolute inset-0 md:hidden">
        <div className="absolute inset-0 bg-[#06070b]" />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: "url('/ui/auth-mobile-bg.svg')" }}
        />
      </div>

      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        <div className="absolute -left-24 -top-24 h-[320px] w-[320px] rounded-full bg-amber-600/4 blur-[96px]" />
        <div className="absolute -bottom-24 -right-24 h-[320px] w-[320px] rounded-full bg-purple-600/4 blur-[96px]" />
      </div>

      {mobileHeader ? <div className="relative z-10 md:hidden">{mobileHeader}</div> : null}

      {/* Header */}
      <header className={cn("relative z-10 flex h-16 items-center justify-between px-6", mobileHeader && "hidden md:flex")}>
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="TinyTale"
            width={420}
            height={108}
            className="h-[108px] w-auto"
            style={{ width: "auto" }}
          />
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/" className="hidden transition hover:text-white sm:block">Home</Link>
          <Link href="/browse" className="hidden transition hover:text-white sm:block">Browse</Link>
          {navRight || (
            <Link href="/help" className="transition hover:text-white">Download App</Link>
          )}
        </div>
      </header>

      {/* Content */}
      <main className={cn("relative z-10 flex flex-1 items-center justify-center px-4 py-8", contentClassName)}>
        {children}
      </main>

      {/* Footer */}
      <footer className={cn("relative z-10 border-t border-gray-800/50 py-6 text-center", hideFooterOnMobile && "hidden md:block")}>
        <p className="text-xs text-gray-600">&copy; 2025 TinyTale. All rights reserved.</p>
        <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-600">
          <Link href="/help" className="transition hover:text-gray-400">Privacy Policy</Link>
          <span>·</span>
          <Link href="/help" className="transition hover:text-gray-400">Terms of Service</Link>
          <span>·</span>
          <Link href="/help" className="transition hover:text-gray-400">Help Center</Link>
        </div>
      </footer>
    </div>
  );
}
