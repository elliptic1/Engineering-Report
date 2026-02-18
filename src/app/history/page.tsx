"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-dark-600 border-t-primary-500" />
          Loading...
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // TODO: Fetch actual history from Firestore
  const history: any[] = [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analysis History</h1>
          <p className="mt-2 text-slate-400">
            View your past contributor analyses
          </p>
        </div>
        <Link
          href="/analyze"
          className="rounded-lg bg-primary-500 px-6 py-2 font-semibold text-dark-900 no-underline transition hover:bg-primary-400"
        >
          New Analysis
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dark-600 bg-dark-800 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-white">
            No analyses yet
          </h2>
          <p className="mt-2 text-slate-400">
            Run your first analysis to see it here.
          </p>
          <Link
            href="/analyze"
            className="mt-6 inline-block rounded-lg bg-primary-500 px-6 py-2 font-semibold text-dark-900 no-underline transition hover:bg-primary-400"
          >
            Start Analyzing
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {history.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-dark-600 bg-dark-800 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {item.repo}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Contributor: {item.login}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">{item.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
