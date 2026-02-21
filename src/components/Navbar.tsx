"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { user, loading, signInWithGitHub } = useAuth();

  return (
    <nav className="border-b border-dark-600 bg-dark-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <svg
            className="h-8 w-8 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="text-xl font-bold text-white">Engineering Report</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/analyze"
                className="text-sm text-slate-300 no-underline hover:text-white"
              >
                Analyze
              </Link>
              <Link
                href="/history"
                className="text-sm text-slate-300 no-underline hover:text-white"
              >
                History
              </Link>
              <Link
                href="/settings"
                className="text-sm text-slate-300 no-underline hover:text-white"
              >
                Settings
              </Link>
              <Link href="/settings">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-700 text-sm text-slate-300">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            </>
          ) : loading ? (
            // Brief loading state - but NOT a skeleton that breaks the page
            <span className="text-sm text-slate-400">...</span>
          ) : (
            <button
              onClick={() => signInWithGitHub()}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-dark-900 transition hover:bg-primary-400"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
