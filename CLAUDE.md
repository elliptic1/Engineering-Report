# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Engineering Report is a Next.js 14 web app that generates sprint-ready contributor summaries from GitHub repository activity. It analyzes pull requests, commits, and code reviews to produce markdown briefs for engineering managers.

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint with zero warnings tolerance
npm run typecheck    # TypeScript strict check (tsc --noEmit)
```

No test framework is configured. Validation relies on `lint` and `typecheck`.

## Architecture

**Next.js App Router** with TypeScript strict mode, Tailwind CSS, Firebase Auth (GitHub OAuth), and GitHub REST API.

### Core Data Flow

1. **Form** (`src/components/Form.tsx`) collects repo URL, contributor handle, date range
2. **API Route** (`src/app/api/analyze/route.ts`) validates with Zod, normalizes repo URL, orchestrates collection + summarization
3. **Collector** (`src/lib/collector.ts`) fetches PRs (max 7), commits (max 7), reviews (max 5) via GitHub REST API with exponential backoff
4. **Text heuristics** (`src/lib/text.ts`) rank and select the most impactful PRs/commits
5. **Summarizer** (`src/lib/summarize.ts`) generates deterministic markdown (no LLM currently; `callChatGPT()` is a future integration point)
6. **Results** (`src/components/Results.tsx`) renders markdown summary with citations

### Key Directories

- `src/app/` — App Router pages and API routes
- `src/components/` — Client components (`"use client"`)
- `src/lib/` — Business logic: GitHub API client, data collection, summarization, Zod schemas
- `src/contexts/` — Firebase auth context and `useAuth()` hook

### GitHub API Client (`src/lib/github.ts`)

Wraps `fetch` against GitHub REST API v2022-11-28. Implements retry with exponential backoff and jitter for rate limits (429/403). Respects `Retry-After` header.

## Code Conventions

- **No `console.log`** — ESLint enforces this; only `console.warn` and `console.error` are allowed
- **Zod for validation** — All API inputs validated with Zod schemas (`src/lib/schemas.ts`), types inferred via `z.infer<>`
- **Path alias** — `@/*` maps to `src/*`
- **Styling** — Tailwind utility classes only; custom dark theme palette (`dark-900` through `dark-500`) and green primary (`primary-500: #10b981`)

## Environment Variables

**Required:** `GITHUB_TOKEN` — Fine-grained GitHub PAT with public repo read access

**Firebase (NEXT_PUBLIC_*):** API key, auth domain, project ID (defaults to `engineering-report-e4af5`), storage bucket, messaging sender ID, app ID

See `.env.local.example` for the full list.

## Deployment

Firebase Hosting with Cloud Functions (us-central1). Project ID: `engineering-report-e4af5`.

## Incomplete Features

- **History page**: Firestore integration not yet implemented
- **Settings page**: Stripe checkout for Pro plan not connected
- **Usage tracking**: Hardcoded "0 / 5"; needs backend
- **LLM summarization**: `callChatGPT()` in `summarize.ts` is a stub for future LLM integration
