import type { EvidenceT } from "./schemas";

export type PullRequestCandidate = EvidenceT["prs"][number] & {
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  labels?: string[];
};

export type CommitCandidate = EvidenceT["commits"][number];

export function isTestPath(path: string): boolean {
  return /(?:^|\/)__(tests?|specs?)__\//i.test(path) ||
    /(?:^|\/)(test|tests|__tests__)\//i.test(path) ||
    /\.(test|spec)\.[jt]sx?$/i.test(path);
}

const prWeight = (pr: PullRequestCandidate) =>
  (pr.additions ?? 0) +
  (pr.deletions ?? 0) +
  (pr.changedFiles ?? 0) * 5;

export function chooseNotablePRs(prs: PullRequestCandidate[], limit = 7): PullRequestCandidate[] {
  if (prs.length <= limit) {
    return [...prs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  const sorted = [...prs].sort((a, b) => prWeight(b) - prWeight(a));
  const picks = sorted.slice(0, limit);

  const smallest = [...prs].sort((a, b) => prWeight(a) - prWeight(b))[0];
  if (smallest && !picks.some((pr) => pr.number === smallest.number)) {
    picks[picks.length - 1] = smallest;
  }

  return picks.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

const commitWeight = (commit: CommitCandidate) => {
  const additions = commit.additions ?? 0;
  const deletions = commit.deletions ?? 0;
  const renameBonus = commit.files?.some((file) => file.status === "renamed" || file.previous_filename)
    ? 500
    : 0;
  return additions + deletions * 1.2 + renameBonus;
};

export function chooseNotableCommits(commits: CommitCandidate[], limit = 7): CommitCandidate[] {
  if (commits.length <= limit) {
    return [...commits].sort((a, b) => (a.committedDate < b.committedDate ? 1 : -1));
  }

  const sorted = [...commits].sort((a, b) => commitWeight(b) - commitWeight(a));
  const picks = sorted.slice(0, limit);

  const renameHeavy = commits.find((commit) =>
    commit.files?.some((file) => file.status === "renamed" || !!file.previous_filename)
  );

  if (renameHeavy && !picks.some((commit) => commit.sha === renameHeavy.sha)) {
    picks[picks.length - 1] = renameHeavy;
  }

  return picks.sort((a, b) => (a.committedDate < b.committedDate ? 1 : -1));
}
