import { setTimeout as delay } from "timers/promises";

const MAX_RETRIES = 5;
const BASE_URL = "https://api.github.com";
const token = process.env.GITHUB_TOKEN;

async function request<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (response.status === 429 || response.status === 403) {
      attempt += 1;
      if (attempt > MAX_RETRIES) {
        throw new Error(`GitHub rate limit reached after ${MAX_RETRIES} retries.`);
      }
      const retryAfter = Number(response.headers.get("Retry-After"));
      const backoffBase = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 2 ** attempt;
      const jitter = 0.75 + Math.random() * 0.5;
      await delay(backoffBase * 1000 * jitter);
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub API request failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<T>;
  }

  throw new Error("Unable to fulfil GitHub request after retries.");
}

export async function listPullRequests(owner: string, repo: string, page = 1) {
  return request<any[]>(
    `/repos/${owner}/${repo}/pulls?state=all&per_page=100&page=${page}`
  );
}

export async function getPullRequest(owner: string, repo: string, pullNumber: number) {
  return request<any>(`/repos/${owner}/${repo}/pulls/${pullNumber}`);
}

export async function getPullRequestFiles(owner: string, repo: string, pullNumber: number, page = 1) {
  return request<any[]>(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100&page=${page}`
  );
}

export async function getPullRequestReviews(owner: string, repo: string, pullNumber: number) {
  return request<any[]>(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews?per_page=100`
  );
}

export async function listCommits(
  owner: string,
  repo: string,
  author: string,
  page = 1,
  since?: string,
  until?: string
) {
  const params = new URLSearchParams({
    author,
    per_page: "100",
    page: String(page)
  });
  if (since) params.set("since", since);
  if (until) params.set("until", until);

  return request<any[]>(`/repos/${owner}/${repo}/commits?${params}`);
}

export async function getCommit(owner: string, repo: string, sha: string) {
  return request<any>(`/repos/${owner}/${repo}/commits/${sha}`);
}
