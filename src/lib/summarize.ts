import { EvidenceT } from "./schemas";
import { isTestPath } from "./text";

const headlineKeywords: { pattern: RegExp; template: (title: string, login: string) => string }[] = [
  {
    pattern: /migrat/i,
    template: (title, login) => `${login} led migration work: ${title}`
  },
  {
    pattern: /refactor/i,
    template: (title, login) => `${login} refactored core flows with "${title}"`
  },
  {
    pattern: /fix|patch|bug/i,
    template: (title, login) => `${login} unblocked teammates by shipping "${title}"`
  },
  {
    pattern: /enable|unlock|unblock/i,
    template: (title, login) => `${login} helped unblock the team with "${title}"`
  }
];

function buildHeadline(evidence: EvidenceT): string {
  const primary = evidence.prs[0];
  if (!primary) {
    const commit = evidence.commits[0];
    return commit
      ? `${evidence.login} contributed updates like "${commit.message.split("\n")[0]}"`
      : `${evidence.login} contributed steady improvements across the codebase`;
  }

  const match = headlineKeywords.find(({ pattern }) => pattern.test(primary.title));
  if (match) {
    return match.template(primary.title, evidence.login);
  }

  return `${evidence.login} advanced ${evidence.repo} with "${primary.title}"`;
}

function keyImpactBullets(evidence: EvidenceT): string[] {
  if (evidence.prs.length === 0) {
    return evidence.commits.slice(0, 3).map((commit) => `Commit ${commit.sha.slice(0, 7)} — ${commit.message.split("\n")[0]}`);
  }

  return evidence.prs.slice(0, 4).map((pr) => `PR #${pr.number}: ${pr.title}`);
}

function collaborationNotes(evidence: EvidenceT): string[] {
  if (evidence.reviewsGiven.length === 0) {
    return ["Pair with another maintainer to spread the migration context next sprint."];
  }

  return evidence.reviewsGiven.slice(0, 5).map((review) => {
    const snippet = review.body ? review.body.split("\n")[0].slice(0, 120) : "left a concise review";
    return `Reviewed PR #${review.prNumber} (${review.state.toLowerCase()}): ${snippet}`;
  });
}

function engineeringSignals(evidence: EvidenceT): string[] {
  const signals = new Set<string>();
  const testTouched = evidence.prs.some((pr) => pr.files?.some((file) => isTestPath(file)));
  if (testTouched) {
    signals.add("Kept tests in lockstep with feature work.");
  }

  const majorCleanup = evidence.commits.find((commit) => (commit.deletions ?? 0) > (commit.additions ?? 0) * 1.5);
  if (majorCleanup) {
    signals.add(`Delivered cleanup commit ${majorCleanup.sha.slice(0, 7)} with ${(majorCleanup.deletions ?? 0).toLocaleString()} deletions.`);
  }

  const renames = evidence.commits.some((commit) => commit.files?.some((file) => file.status === "renamed" || file.previous_filename));
  if (renames) {
    signals.add("Handled file moves/renames carefully during the sprint.");
  }

  if (signals.size === 0) {
    signals.add("Maintained reliable delivery with incremental, review-friendly changes.");
  }

  return Array.from(signals);
}

function growthIdeas(): string[] {
  return ["Consider slicing future PRs so reviews land even faster."];
}

function nextSprintSuggestions(evidence: EvidenceT): string[] {
  const labelSet = new Set<string>();
  for (const pr of evidence.prs) {
    for (const label of pr.labels ?? []) {
      labelSet.add(label.toLowerCase());
    }
  }

  const suggestions: string[] = [];
  if (labelSet.has("documentation")) {
    suggestions.push("Follow through on documentation updates so onboarding stays easy.");
  }

  if (labelSet.has("infra") || labelSet.has("infrastructure")) {
    suggestions.push("Plan a sync with infra owners to de-risk upcoming changes.");
  }

  const areaCounts = new Map<string, number>();
  for (const path of evidence.prs.flatMap((pr) => pr.files ?? [])) {
    const area = path.split("/")[0];
    if (!area) continue;
    areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
  }

  const topEntry = Array.from(areaCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  if (topEntry) {
    const [topFile] = topEntry;
    suggestions.push(`Schedule focused follow-up on the ${topFile} area to capitalise on momentum.`);
  }

  if (suggestions.length === 0) {
    suggestions.push("Identify one stretch area with the EM for next sprint.");
  }

  return suggestions.slice(0, 2);
}

function uniqueCitations(evidence: EvidenceT): string[] {
  const links = new Set<string>();
  for (const pr of evidence.prs) {
    links.add(pr.url);
  }
  for (const commit of evidence.commits) {
    links.add(commit.url);
  }
  return Array.from(links).slice(0, 6);
}

export function summarizeContributor(evidence: EvidenceT): { summary: string; citations: string[] } {
  const headline = buildHeadline(evidence);
  const keyImpacts = keyImpactBullets(evidence);
  const collab = collaborationNotes(evidence);
  const signals = engineeringSignals(evidence);
  const growth = growthIdeas();
  const suggestions = nextSprintSuggestions(evidence);
  const citations = uniqueCitations(evidence);

  const summary = [
    "## Headline",
    headline,
    "",
    "### Key impacts",
    ...keyImpacts.map((line) => `- ${line}`),
    "",
    "### Collaboration & review notes",
    ...collab.map((line) => `- ${line}`),
    "",
    "### Engineering signals",
    ...signals.map((line) => `- ${line}`),
    "",
    "### Growth & coaching",
    ...growth.map((line) => `- ${line}`),
    "",
    "### Next-sprint suggestions",
    ...suggestions.map((line) => `- ${line}`)
  ].join("\n");

  return { summary, citations };
}

export async function callChatGPT(evidence: EvidenceT): Promise<string> {
  // TODO: Integrate ChatGPT once the production key is available.
  return Promise.resolve(`LLM summary placeholder for ${evidence.login} in ${evidence.repo}`);
}
