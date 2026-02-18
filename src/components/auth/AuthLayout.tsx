"use client";

import Link from "next/link";
import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
  navRight?: React.ReactNode;
}

export function AuthLayout({ children, navRight }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#0F1014] flex flex-col">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-amber-600/5 blur-[150px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/5 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="TinyTale" width={420} height={108} className="h-[108px] w-auto" />
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
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 py-6 text-center">
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
