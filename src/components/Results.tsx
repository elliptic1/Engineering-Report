"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { EvidenceT } from "@/lib/schemas";

type Props = {
  summary: string;
  citations: string[];
  evidence: EvidenceT;
  onReset: () => void;
};

export default function Results({ summary, citations, evidence, onReset }: Props) {
  return (
    <section className="space-y-6 rounded-xl border border-dark-600 bg-dark-800 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Summary</h2>
          <p className="text-sm text-slate-400">
            Covering {evidence.window.since.slice(0, 10)} → {evidence.window.until.slice(0, 10)} for{" "}
            <span className="font-medium text-slate-200">{evidence.login}</span> in{" "}
            <span className="font-medium text-slate-200">{evidence.repo}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-lg border border-dark-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-dark-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
        >
          Run again
        </button>
      </div>

      <article className="prose prose-invert max-w-none text-slate-100">
        <ReactMarkdown remarkPlugins={[remarkGfm as any]}>{summary}</ReactMarkdown>
      </article>

      {citations.length > 0 ? (
        <div className="rounded-lg border border-dark-600 bg-dark-900 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Citations
          </h3>
          <ul className="mt-2 grid gap-2 text-sm">
            {citations.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="break-all">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
