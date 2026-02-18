"use client";

import { useId, useMemo, useState } from "react";

export type FormState = {
  repoUrl: string;
  login: string;
  since?: string;
  until?: string;
};

type Props = {
  isLoading: boolean;
  onSubmit: (values: FormState) => void;
};

const todayIso = () => new Date().toISOString().slice(0, 16);

export default function Form({ isLoading, onSubmit }: Props) {
  const repoId = useId();
  const loginId = useId();
  const sinceId = useId();
  const untilId = useId();

  const [repoUrl, setRepoUrl] = useState("");
  const [login, setLogin] = useState("");
  const [since, setSince] = useState<string>("");
  const [until, setUntil] = useState<string>("");

  const now = useMemo(todayIso, []);

  const toIso = (value: string) => (value ? new Date(value).toISOString() : undefined);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      repoUrl,
      login,
      since: toIso(since) ?? undefined,
      until: toIso(until) ?? undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-xl border border-dark-600 bg-dark-800 p-6 shadow-lg shadow-dark-900/40"
    >
      <div className="grid gap-1">
        <label htmlFor={repoId} className="text-sm font-medium text-slate-200">
          Repository URL
        </label>
        <input
          id={repoId}
          required
          type="url"
          placeholder="https://github.com/owner/repo"
          className="w-full rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-base text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40"
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor={loginId} className="text-sm font-medium text-slate-200">
          Contributor handle
        </label>
        <input
          id={loginId}
          required
          type="text"
          placeholder="octocat"
          className="w-full rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-base text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40"
          value={login}
          onChange={(event) => setLogin(event.target.value)}
        />
      </div>

      <div className="grid gap-1 md:grid-cols-2 md:gap-4">
        <div className="grid gap-1">
          <label htmlFor={sinceId} className="text-sm font-medium text-slate-200">
            Since (optional)
          </label>
          <input
            id={sinceId}
            type="datetime-local"
            max={until || now}
            className="w-full rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-base text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40"
            value={since}
            onChange={(event) => setSince(event.target.value)}
          />
        </div>

        <div className="grid gap-1">
          <label htmlFor={untilId} className="text-sm font-medium text-slate-200">
            Until (optional)
          </label>
          <input
            id={untilId}
            type="datetime-local"
            min={since || undefined}
            max={now}
            className="w-full rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-base text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40"
            value={until}
            onChange={(event) => setUntil(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-dark-900 transition hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
        >
          {isLoading ? "Analyzing…" : "Analyze"}
        </button>
        <p className="text-xs text-slate-400">
          Defaults to the last 30 days when no window is provided.
        </p>
      </div>
    </form>
  );
}
