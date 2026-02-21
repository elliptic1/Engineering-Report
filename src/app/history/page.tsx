"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getUserHistory, type AnalysisRecord } from "@/lib/history";

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setFetching(true);

    getUserHistory(user.uid)
      .then((records) => {
        if (!cancelled) {
          setHistory(records);
        }
      })
      .catch((err) => {
        console.error("Failed to load history:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (loading || (fetching && user)) {
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
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-dark-600 bg-dark-800 p-6 transition hover:border-dark-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {item.repo}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Contributor: {item.contributor}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-slate-400">
                    {item.createdAt.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="rounded-lg border border-dark-600 px-3 py-1 text-sm text-slate-300 transition hover:border-dark-500 hover:text-white"
                  >
                    {expandedId === item.id ? "Collapse" : "View"}
                  </button>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="mt-4 border-t border-dark-700 pt-4">
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm text-slate-200">
                    {item.summary}
                  </div>
                  {item.citations.length > 0 && (
                    <div className="mt-4 rounded-lg border border-dark-600 bg-dark-900 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Citations
                      </h4>
                      <ul className="mt-2 grid gap-1 text-sm">
                        {item.citations.map((url) => (
                          <li key={url}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all text-primary-500 hover:text-primary-400"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
