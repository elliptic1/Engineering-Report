# Repo → Contributor Briefs

Generate sprint-ready contributor briefs for any public GitHub repository. Paste a repo URL, choose a contributor handle, and the app will gather their recent pull requests, commits, and reviews via the GitHub MCP API before producing a conversational summary tailored for engineering managers.

## Prerequisites

- Node.js 18+
- npm 9+
- A fine-grained GitHub personal access token (public repo read access)

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your details:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Description |
   | --- | --- |
   | `GITHUB_MCP_URL` | URL of the GitHub MCP host. Defaults to `https://api.githubcopilot.com/mcp/`. |
   | `GITHUB_TOKEN` | Fine-grained PAT with read-only access for public repositories. |

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000> to launch the UI. Enter a repository URL such as `https://github.com/vercel/next.js` and a contributor handle, then click **Analyze**.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Start the production server (after `npm run build`). |
| `npm run lint` | Run ESLint with zero warnings allowed. |
| `npm run typecheck` | Run TypeScript in no-emit mode. |

## Architecture overview

- **Next.js App Router** renders the landing page, handles form submission, and displays summaries with Tailwind CSS styling.
- **API Route** (`POST /api/analyze`) validates input, normalizes the repository, collects evidence from GitHub via the MCP tools, and runs the deterministic summariser.
- **MCP client** wraps the GitHub MCP host, adding pagination support and exponential backoff for rate limits.
- **Collector** enforces small evidence caps while selecting representative PRs, commits, and reviews for the contributor.
- **Summariser** generates markdown-formatted briefs with sections for headline, key impacts, collaboration, engineering signals, growth, and next-sprint suggestions.

## Testing the flow

1. Ensure `.env.local` is configured with a valid GitHub token.
2. Run `npm run dev` and open the app in a browser.
3. Paste a public repo and contributor handle, then click **Analyze**.
4. Confirm the brief includes:
   - A headline and sectioned summary
   - 3–6 citation links to PRs/commits
   - Graceful errors when the repo or contributor cannot be resolved

## Notes

- All MCP requests stay on the server—no tokens are exposed to the browser.
- The summariser currently uses a deterministic template. `callChatGPT()` in `src/lib/summarize.ts` is the single integration point for wiring a production LLM when ready.
- Evidence collection is capped (max 7 PRs and commits, max 5 review snippets) to keep requests responsive and manageable.
