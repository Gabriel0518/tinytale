"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 bg-bg-primary/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent-primary">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          <span className="text-xl font-bold text-text-primary">TinyTale</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Home
          </Link>
          <Link
            href="/category"
            className="text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Categories
          </Link>
          <Link
            href="/dramas"
            className="text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Dramas
          </Link>
        </div>

        {/* Search & User */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden relative md:block">
            <input
              type="text"
              placeholder="Search dramas..."
              className="w-64 rounded-full bg-bg-secondary px-4 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6 text-text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-bg-elevated bg-bg-primary md:hidden">
          <div className="space-y-2 px-4 py-4">
            <input
              type="text"
              placeholder="Search dramas..."
              className="w-full rounded-full bg-bg-secondary px-4 py-2 text-sm text-text-primary placeholder-text-tertiary"
            />
            <Link
              href="/"
              className="block py-2 text-sm font-medium text-text-secondary"
            >
              Home
            </Link>
            <Link
              href="/category"
              className="block py-2 text-sm font-medium text-text-secondary"
            >
              Categories
            </Link>
            <Link
              href="/dramas"
              className="block py-2 text-sm font-medium text-text-secondary"
            >
              Dramas
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
