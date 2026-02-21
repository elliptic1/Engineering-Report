"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { EvidenceT } from "@/lib/schemas";
import { RepoInput } from "@/lib/schemas";
import Form from "@/components/Form";
import { useAuth } from "@/contexts/AuthContext";

const Results = dynamic(() => import("@/components/Results"), { ssr: false });

type AnalyzeResponse = {
  ok: true;
  summary: string;
  citations: string[];
  evidence: EvidenceT;
};

type ErrorResponse = {
  ok: false;
  error: string;
};

type FormValues = {
  repoUrl: string;
  login: string;
  since?: string;
  until?: string;
};

export default function AnalyzePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleSubmit = useCallback(async (values: FormValues) => {
    setError(null);
    setLoading(true);
    setResult(null);

    const payload: FormValues = {
      repoUrl: values.repoUrl.trim(),
      login: values.login.trim(),
    };

    if (values.since) {
      payload.since = values.since;
    }
    if (values.until) {
      payload.until = values.until;
    }

    const validation = RepoInput.safeParse(payload);
    if (!validation.success) {
      setLoading(false);
      setError("Please provide a valid repository URL and contributor handle.");
      return;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.data),
      });

      const json = (await response.json()) as AnalyzeResponse | ErrorResponse;

      if (!response.ok || !json.ok) {
        const message = !json.ok ? json.error : response.statusText;
        setError(message || "Unable to generate a brief right now.");
        return;
      }

      setResult(json);

      // Persist to Firestore and track usage in the background (lazy-loaded)
      if (user) {
        import("@/lib/history").then(({ saveAnalysis }) => {
          saveAnalysis({
            userId: user.uid,
            repo: json.evidence.repo,
            contributor: json.evidence.login,
            summary: json.summary,
            citations: json.citations,
          }).catch((saveErr) => {
            console.error("Failed to save analysis:", saveErr);
          });
        });

        import("@/lib/usage").then(({ incrementUsage }) => {
          incrementUsage(user.uid).catch((err) => {
            console.error("Failed to increment usage:", err);
          });
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const heading = useMemo(
    () =>
      result
        ? `Contributor brief for ${result.evidence.login} in ${result.evidence.repo}`
        : "Analyze Contributor",
    [result]
  );

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

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-primary-500/80">
          LLM-ready insights
        </p>
        <h1 className="text-4xl font-semibold text-white md:text-5xl">{heading}</h1>
        <p className="max-w-3xl text-base text-slate-300">
          Paste a GitHub repository URL and a contributor handle to produce a
          sprint-ready brief summarizing their recent pull requests, commits, and
          reviews.
        </p>
      </header>

      <Form isLoading={isLoading} onSubmit={handleSubmit} />

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/60 bg-red-500/10 p-4 text-red-200"
        >
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-300">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-dark-600 border-t-primary-500" />
          Generating contributor brief…
        </div>
      ) : null}

      {result ? (
        <Results
          summary={result.summary}
          citations={result.citations}
          evidence={result.evidence}
          onReset={handleReset}
        />
      ) : null}
    </main>
  );
}
