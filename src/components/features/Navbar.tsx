"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";

interface NavbarProps {
  activePath?: string;
  variant?: "default" | "transparent";
  showSearch?: boolean;
  showAuthButtons?: boolean;
  className?: string;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/rankings", label: "Rankings" },
];

export function Navbar({
  activePath,
  variant = "default",
  showSearch = true,
  showAuthButtons = true,
  className,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  const bgClass =
    variant === "transparent"
      ? "bg-transparent"
      : "bg-[#141414]/95 backdrop-blur-sm";

  return (
    <nav className={cn("fixed left-0 right-0 top-0 z-50", bgClass, className)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          <span className="text-xl font-bold text-white">TinyTale</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition hover:text-white",
                activePath === link.href ? "text-white" : "text-gray-300"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {showSearch && (
            <Link href="/search" className="text-gray-300 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          )}

          {user ? (
            /* Authenticated State */
            <div className="flex items-center gap-3">
              <Link
                href="/user/coins"
                className="flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 text-sm text-yellow-500 transition hover:bg-gray-700"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span className="font-medium">{user.coins || 0}</span>
                <span className="text-xs font-semibold text-yellow-400">ADD</span>
              </Link>
              <Link
                href="/user/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-white"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.nickname} className="h-full w-full rounded-full object-cover" />
                ) : (
                  user.nickname?.charAt(0).toUpperCase() || "U"
                )}
              </Link>
            </div>
          ) : showAuthButtons ? (
            /* Unauthenticated State */
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-300 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Get Started
              </Link>
            </div>
          ) : null}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-gray-800 bg-[#141414] md:hidden">
          <div className="space-y-2 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "block py-2 text-sm font-medium",
                  activePath === link.href ? "text-white" : "text-gray-400"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
