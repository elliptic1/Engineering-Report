# Prompt for Base44 Coding Agent: Build "Repo → Contributor Briefs"

You are building a production-ready Next.js 14 web application called **Repo → Contributor Briefs**. The app generates sprint-ready contributor summaries for any public GitHub repository by talking to the GitHub MCP API. Recreate the experience described below exactly.

## High-level product goals
- Landing page with a hero section that explains the tool and invites users to analyze a repo + contributor pair.
- Client-side form that collects repository URL, contributor handle, and optional "since"/"until" datetime window.
- Call a Next.js App Router API route that validates input, queries GitHub MCP for data, and produces a deterministic markdown summary with citations.
- Display rich results including a markdown-rendered report, metadata about the analysis window, and citation links.
- Enforce a dark, slate-on-sky visual theme that matches the reference styling.

## Tech stack & project setup
- Next.js 14 with the App Router and TypeScript enabled.
- Tailwind CSS for styling; configure `globals.css` with slate background, sky accents, underlined links, and disabled button styles.
- Install and configure `react-markdown` with the `remark-gfm` plugin for rendering summaries.
- Use `zod` for runtime validation of the request payload.
- Wrap the GitHub MCP REST interface with a reusable client that retries on rate limits and supports pagination.

## Routes and structure
```
src/
  app/
    layout.tsx      // Global layout with Tailwind globals
    page.tsx        // Landing page + client form + results section
    api/
      analyze/route.ts // POST handler for the contributor brief workflow
  components/
    Form.tsx        // Controlled form component (client component)
    Results.tsx     // Markdown summary display (client component)
  lib/
    schemas.ts      // zod schemas for RepoInput and Evidence
    collector.ts    // GitHub MCP data collection helpers
    mcp.ts          // Low-level MCP HTTP client with retries/backoff
    summarize.ts    // Deterministic summariser that emits markdown + citations
    text.ts         // Heuristics for choosing notable PRs/commits (implement helper logic)
  styles/
    globals.css     // Tailwind baseline styles
```

## Detailed requirements
1. **Layout & styling**
   - Centered column layout (`max-w-5xl`, generous padding) with slate gradients and sky accents.
   - Hero heading text: `Repo → Contributor Briefs` when idle, swapping to `Contributor brief for <login> in <repo>` after a successful run.
   - Subtitle paragraph explains that the analysis stays server-side to keep secrets safe.
   - Loading state shows a spinning border indicator with the caption `Generating contributor brief…`.
   - Errors render inside a red-accented alert box with rounded corners.

2. **Form behaviour**
   - Controlled inputs for repository URL, contributor handle, optional `since` and `until` datetime-local pickers.
   - `Analyze` button disables while loading and changes its label to `Analyzing…`.
   - When submitted, trim inputs, convert datetime-local values to ISO timestamps, validate with `RepoInput.safeParse`, and POST the validated payload to `/api/analyze`.
   - Display helper copy: `Defaults to the last 30 days when no window is provided.`

3. **API route logic**
   - Accept POST requests, parse JSON body, validate with `RepoInput`.
   - Normalize incoming repo URLs (`https://github.com/owner/repo`, `owner/repo`, `.git` suffix) into `{ owner, repo }`.
   - Collect evidence by combining:
     - Recent pull requests authored by the contributor (cap at 7, but consider up to 3× that many before filtering).
     - Commits authored by the contributor within the window (cap at 7 detailed entries, fetching stats and file lists up to 10 commits).
     - Review activity where the contributor left feedback (cap 5 entries).
   - Use the MCP tools `list_pull_requests`, `get_pull_request`, `get_pull_request_files`, `get_pull_request_reviews`, `list_commits`, `get_commit`.
   - Implement exponential backoff with jitter for 429/403 responses; respect optional `Retry-After` header.
   - Return `{ ok: true, summary, citations, evidence }` on success or `{ ok: false, error }` with proper status codes on failure.

4. **Summariser**
   - Deterministic markdown layout with sections: Headline, Key impacts, Collaboration & review notes, Engineering signals, Growth & coaching, Next-sprint suggestions.
   - Derive a headline from the top PR title or fallback to commit messages.
   - Generate bullets using helper heuristics (tests touched, cleanups, renames, labels, top file area, etc.).
   - Produce up to 6 citation URLs gathered from PRs and commits.

5. **Results display**
   - Render markdown summary inside `.prose.prose-invert` typography container.
   - Show the analyzed contributor/login and the ISO date window (`YYYY-MM-DD → YYYY-MM-DD`).
   - Include a `Run again` button that clears the result and error state.
   - Render citation list as external links with underline styling.

6. **Environment configuration**
   - Expect `GITHUB_MCP_URL` and `GITHUB_TOKEN` environment variables; fall back to `https://api.githubcopilot.com/mcp` when unset.
   - Document setup steps in `README.md` (installation, env config, `npm run dev`, build/test scripts).

7. **Quality checks**
   - Provide npm scripts: `dev`, `build`, `start`, `lint`, `typecheck`.
   - Ensure TypeScript strictness, no lint warnings, and fully typed helper functions.
   - Add graceful error messages for validation errors and unexpected server failures.

Deliver the complete project so another engineer can run `npm install`, configure the env file, and immediately analyze contributors.
