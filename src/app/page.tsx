"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    title: "PR Analysis",
    description:
      "Deep analysis of pull requests, commits, and code reviews to understand contribution patterns.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    title: "Team Insights",
    description:
      "Analyze entire teams to identify collaboration patterns and top contributors.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    title: "Engineering Signals",
    description:
      "Evaluate code quality, review thoroughness, and technical depth.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    title: "Sprint-Ready",
    description:
      "Get actionable summaries designed for sprint planning and performance reviews.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "Private Repos",
    description:
      "Securely analyze private repositories with GitHub OAuth integration.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
  },
  {
    title: "Historical Data",
    description:
      "Store and review past analyses to track contributor growth over time.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "5 analyses per month",
    features: ["Public repositories", "Team analysis", "30-day history"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "100 analyses per month",
    features: [
      "Private repositories",
      "Team analysis",
      "365-day history",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
];

export default function HomePage() {
  const { user, signInWithGitHub } = useAuth();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="px-6 py-24 text-center">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold text-white md:text-6xl">
          Generate comprehensive contributor insights from GitHub activity
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Analyze PRs, commits, reviews, and collaboration patterns with AI.
          Get sprint-ready summaries for your entire team.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          {user ? (
            <Link
              href="/analyze"
              className="rounded-lg bg-primary-500 px-8 py-3 text-lg font-semibold text-dark-900 no-underline transition hover:bg-primary-400"
            >
              Start Analyzing
            </Link>
          ) : (
            <button
              onClick={() => signInWithGitHub()}
              className="rounded-lg bg-primary-500 px-8 py-3 text-lg font-semibold text-dark-900 transition hover:bg-primary-400"
            >
              Get Started Free
            </button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-dark-600 bg-dark-800 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-white">
            Everything You Need for Contributor Insights
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-dark-600 bg-dark-900 p-6"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary-500/10 p-3 text-primary-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-t border-dark-600 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Simple Pricing</h2>
            <p className="mt-4 text-slate-400">
              Start free, upgrade when you need more.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:mx-auto lg:max-w-4xl">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.highlighted
                    ? "border-primary-500 bg-dark-800"
                    : "border-dark-600 bg-dark-900"
                }`}
              >
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <p className="mt-2 text-slate-400">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-slate-300">
                      <svg
                        className="h-5 w-5 text-primary-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                {user ? (
                  <Link
                    href={plan.highlighted ? "/settings" : "/analyze"}
                    className={`mt-8 block w-full rounded-lg px-6 py-3 text-center font-semibold no-underline transition ${
                      plan.highlighted
                        ? "bg-primary-500 text-dark-900 hover:bg-primary-400"
                        : "border border-dark-600 text-white hover:border-dark-500"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => signInWithGitHub()}
                    className={`mt-8 w-full rounded-lg px-6 py-3 font-semibold transition ${
                      plan.highlighted
                        ? "bg-primary-500 text-dark-900 hover:bg-primary-400"
                        : "border border-dark-600 text-white hover:border-dark-500"
                    }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600 px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Engineering Report. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
