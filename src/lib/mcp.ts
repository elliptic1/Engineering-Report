import { setTimeout as delay } from "timers/promises";

type FetchLike = typeof fetch;

const DEFAULT_BASE_URL = "https://api.githubcopilot.com/mcp";
const MAX_RETRIES = 5;

const baseUrl = (process.env.GITHUB_MCP_URL || DEFAULT_BASE_URL).replace(/\/?$/, "");
const token = process.env.GITHUB_TOKEN;

const clientFetch: FetchLike = global.fetch;

type MCPResponse<T> = {
  result?: T;
  data?: T;
};

async function request<T>(tool: string, params: unknown): Promise<T> {
  const url = `${baseUrl}/tools/${tool}`;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    const response = await clientFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: tool,
        params
      })
    });

    if (response.status === 429 || response.status === 403) {
      attempt += 1;
      if (attempt > MAX_RETRIES) {
        throw new Error(`GitHub MCP rate limit reached after ${MAX_RETRIES} retries.`);
      }
      const retryAfter = Number(response.headers.get("Retry-After"));
      const backoffBase = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 2 ** attempt;
      const jitter = 0.75 + Math.random() * 0.5;
      await delay(backoffBase * 1000 * jitter);
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub MCP request failed (${response.status}): ${text}`);
    }

    const json = (await response.json()) as MCPResponse<T> | T;
    if (json && typeof json === "object" && "result" in json) {
      return (json as MCPResponse<T>).result as T;
    }

    if (json && typeof json === "object" && "data" in json) {
      return (json as MCPResponse<T>).data as T;
    }

    return json as T;
  }

  throw new Error("Unable to fulfil MCP request after retries.");
}

export async function call<T>(tool: string, params: unknown): Promise<T> {
  return request<T>(tool, params);
}

type PaginationParams = {
  owner: string;
  repo: string;
  page?: number;
  perPage?: number;
};

type ListPullRequestsParams = PaginationParams & {
  state?: "open" | "closed" | "all";
};

export async function listPullRequests(owner: string, repo: string, page = 1) {
  const params: ListPullRequestsParams = {
    owner,
    repo,
    page,
    perPage: 100,
    state: "all"
  };
  return call<any[]>("list_pull_requests", params);
}

export async function getPullRequest(owner: string, repo: string, pullNumber: number) {
  return call<any>("get_pull_request", { owner, repo, pullNumber });
}

export async function getPullRequestFiles(owner: string, repo: string, pullNumber: number, page = 1) {
  return call<any[]>("get_pull_request_files", {
    owner,
    repo,
    pullNumber,
    page,
    perPage: 100
  });
}

export async function getPullRequestReviews(owner: string, repo: string, pullNumber: number) {
  return call<any[]>("get_pull_request_reviews", { owner, repo, pullNumber, perPage: 100 });
}

export async function listCommits(owner: string, repo: string, author: string, page = 1, since?: string, until?: string) {
  return call<any[]>("list_commits", {
    owner,
    repo,
    author,
    page,
    perPage: 100,
    since,
    until
  });
}

export async function getCommit(owner: string, repo: string, sha: string) {
  return call<any>("get_commit", { owner, repo, sha });
}
