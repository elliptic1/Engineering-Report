import { Evidence, type EvidenceT } from "./schemas";
import {
  getCommit,
  getPullRequest,
  getPullRequestFiles,
  getPullRequestReviews,
  listCommits,
  listPullRequests
} from "./github";
import { chooseNotableCommits, chooseNotablePRs, type PullRequestCandidate } from "./text";

const MAX_PULL_REQUESTS = 7;
const MAX_COMMITS = 7;
const MAX_REVIEWS_GIVEN = 5;
const MAX_COMMIT_DETAIL = 10;

export function normalizeRepoUrl(url: string): { owner: string; repo: string } {
  const trimmed = url.trim();
  const pattern = /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i;

  const match = trimmed.match(pattern);
  if (match) {
    const [, owner, repo] = match;
    return { owner, repo: repo.replace(/\.git$/, "") };
  }

  if (trimmed.includes("/")) {
    const [owner, repo] = trimmed.split("/");
    if (owner && repo) {
      return { owner, repo: repo.replace(/\.git$/, "") };
    }
  }

  throw new Error(`Unsupported repository URL: ${url}`);
}

export function defaultWindow(): { since: string; until: string } {
  const until = new Date();
  const since = new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { since: since.toISOString(), until: until.toISOString() };
}

function resolveWindow(since?: string, until?: string): { since: string; until: string } {
  if (!since && !until) {
    return defaultWindow();
  }

  const resolvedUntil = until ? new Date(until) : new Date();
  const resolvedSince = since ? new Date(since) : new Date(resolvedUntil.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(resolvedSince.getTime()) || Number.isNaN(resolvedUntil.getTime())) {
    throw new Error("Invalid date window provided.");
  }

  if (resolvedSince > resolvedUntil) {
    throw new Error("The 'since' date must be before the 'until' date.");
  }

  return { since: resolvedSince.toISOString(), until: resolvedUntil.toISOString() };
}

type CollectArgs = {
  owner: string;
  repo: string;
  login: string;
  since?: string;
  until?: string;
};

type ReviewSummary = EvidenceT["reviewsGiven"][number];

type PullRequestDetails = PullRequestCandidate & {
  reviews: EvidenceT["prs"][number]["reviews"];
};

async function collectPullRequests({ owner, repo, login, window }: CollectArgs & { window: { since: string; until: string } }) {
  const collected: PullRequestDetails[] = [];
  const loginLower = login.toLowerCase();
  let page = 1;

  while (collected.length < MAX_PULL_REQUESTS * 3) {
    const pageItems = await listPullRequests(owner, repo, page);
    if (!Array.isArray(pageItems) || pageItems.length === 0) {
      break;
    }

    for (const pr of pageItems) {
      const authorLogin = pr.user?.login?.toLowerCase();
      if (authorLogin !== loginLower) {
        continue;
      }

      const createdAt = pr.created_at || pr.createdAt;
      if (createdAt) {
        const createdDate = new Date(createdAt);
        if (createdDate < new Date(window.since) || createdDate > new Date(window.until)) {
          continue;
        }
      }

      const detail = await getPullRequest(owner, repo, pr.number);
      const files = await collectPullRequestFiles(owner, repo, pr.number);
      const reviews = await getPullRequestReviews(owner, repo, pr.number);

      const reviewSummaries = Array.isArray(reviews)
        ? reviews.map((review) => ({
            author: review.user?.login ?? "unknown",
            state: review.state,
            body: review.body || undefined,
            submittedAt: review.submitted_at || review.submittedAt || detail.updated_at || detail.updatedAt
          }))
        : [];

      const candidate: PullRequestDetails = {
        number: pr.number,
        url: detail.html_url || pr.html_url,
        title: detail.title || pr.title,
        createdAt: detail.created_at || pr.created_at,
        mergedAt: detail.merged_at || null,
        files,
        reviews: reviewSummaries,
        additions: detail.additions,
        deletions: detail.deletions,
        changedFiles: detail.changed_files,
        labels: Array.isArray(detail.labels) ? detail.labels.map((label: any) => label.name).filter(Boolean) : []
      };

      collected.push(candidate);
    }

    if (pageItems.length < 100) {
      break;
    }

    page += 1;
  }

  const notable = chooseNotablePRs(collected, MAX_PULL_REQUESTS);

  const sanitized = notable.map((pr) => ({
    number: pr.number,
    url: pr.url,
    title: pr.title,
    createdAt: pr.createdAt,
    mergedAt: pr.mergedAt,
    labels: pr.labels,
    files: pr.files,
    reviews: pr.reviews
  }));

  const reviewsGiven: ReviewSummary[] = [];
  for (const pr of collected) {
    for (const review of pr.reviews ?? []) {
      if (review.author?.toLowerCase() === loginLower) {
        reviewsGiven.push({
          prNumber: pr.number,
          url: pr.url,
          state: review.state,
          body: review.body,
          submittedAt: review.submittedAt
        });
      }
    }
  }

  return {
    prs: sanitized,
    reviewsGiven: reviewsGiven.slice(0, MAX_REVIEWS_GIVEN)
  };
}

async function collectPullRequestFiles(owner: string, repo: string, pullNumber: number): Promise<string[]> {
  const files: string[] = [];
  let page = 1;

  while (files.length < 500) {
    const pageItems = await getPullRequestFiles(owner, repo, pullNumber, page);
    if (!Array.isArray(pageItems) || pageItems.length === 0) {
      break;
    }

    for (const file of pageItems) {
      if (file && typeof file.filename === "string") {
        files.push(file.filename);
      }
    }

    if (pageItems.length < 100) {
      break;
    }

    page += 1;
  }

  return files;
}

async function collectCommits({ owner, repo, login, window }: CollectArgs & { window: { since: string; until: string } }) {
  const commits: EvidenceT["commits"] = [];
  let page = 1;

  while (commits.length < MAX_COMMIT_DETAIL && page <= 10) {
    const pageItems = await listCommits(owner, repo, login, page, window.since, window.until);
    if (!Array.isArray(pageItems) || pageItems.length === 0) {
      break;
    }

    for (const commit of pageItems) {
      if (!commit || !commit.sha) {
        continue;
      }

      const detail = await getCommit(owner, repo, commit.sha);
      const committedDate =
        commit.commit?.author?.date ||
        commit.commit?.committer?.date ||
        detail.commit?.author?.date ||
        detail.commit?.committer?.date ||
        window.until;

      const entry = {
        sha: commit.sha,
        url: commit.html_url || detail.html_url,
        message: commit.commit?.message || detail.commit?.message || "",
        committedDate,
        additions: detail.stats?.additions,
        deletions: detail.stats?.deletions,
        files: Array.isArray(detail.files)
          ? detail.files.map((file: any) => ({
              filename: file.filename,
              status: file.status,
              previous_filename: file.previous_filename || undefined
            }))
          : undefined
      };

      commits.push(entry);

      if (commits.length >= MAX_COMMIT_DETAIL) {
        break;
      }
    }

    if (pageItems.length < 100) {
      break;
    }

    page += 1;
  }

  return chooseNotableCommits(commits, MAX_COMMITS);
}

export async function collectEvidence(args: CollectArgs): Promise<EvidenceT> {
  const window = resolveWindow(args.since, args.until);
  const repoSlug = `${args.owner}/${args.repo}`;

  const { prs, reviewsGiven } = await collectPullRequests({ ...args, window });
  const commits = await collectCommits({ ...args, window });

  return Evidence.parse({
    repo: repoSlug,
    login: args.login,
    window,
    prs,
    commits,
    reviewsGiven
  });
}
