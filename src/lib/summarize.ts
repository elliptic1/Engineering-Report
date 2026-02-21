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

function buildDeterministicSummary(evidence: EvidenceT): string {
  const headline = buildHeadline(evidence);
  const keyImpacts = keyImpactBullets(evidence);
  const collab = collaborationNotes(evidence);
  const signals = engineeringSignals(evidence);
  const growth = growthIdeas();
  const suggestions = nextSprintSuggestions(evidence);

  return [
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
}

export async function callChatGPT(evidence: EvidenceT): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const systemPrompt = [
    "You are an engineering manager's assistant that produces sprint-ready contributor summaries.",
    "Given evidence of a contributor's GitHub activity (pull requests, commits, and code reviews),",
    "generate a concise markdown summary with exactly these sections:",
    "",
    "## Headline",
    "One sentence summarizing the contributor's most important work this sprint.",
    "",
    "### Key impacts",
    "A bullet list of the most significant changes. Reference PR numbers and commit SHAs where relevant.",
    "",
    "### Collaboration & review notes",
    "Summarize the contributor's review activity and team interactions.",
    "",
    "### Engineering signals",
    "Note quality indicators such as test coverage, cleanup work, careful refactoring, or incremental delivery.",
    "",
    "### Growth & coaching",
    "One or two actionable suggestions for the contributor's professional development.",
    "",
    "### Next-sprint suggestions",
    "Forward-looking recommendations based on the current sprint's work.",
    "",
    "Guidelines:",
    "- Be specific and cite PR numbers, commit SHAs, and file paths from the evidence.",
    "- Keep each section concise — 1-4 bullet points max.",
    "- Use a professional but encouraging tone suitable for a 1:1 or sprint review.",
    "- Do not fabricate information. Only reference data present in the evidence."
  ].join("\n");

  const userMessage = JSON.stringify(
    {
      repo: evidence.repo,
      contributor: evidence.login,
      window: evidence.window,
      pullRequests: evidence.prs.map((pr) => ({
        number: pr.number,
        title: pr.title,
        url: pr.url,
        createdAt: pr.createdAt,
        mergedAt: pr.mergedAt,
        labels: pr.labels,
        files: pr.files,
        reviews: pr.reviews
      })),
      commits: evidence.commits.map((c) => ({
        sha: c.sha,
        message: c.message.split("\n")[0],
        date: c.committedDate,
        additions: c.additions,
        deletions: c.deletions
      })),
      reviewsGiven: evidence.reviewsGiven.map((r) => ({
        prNumber: r.prNumber,
        state: r.state,
        body: r.body?.slice(0, 200)
      }))
    },
    null,
    2
  );

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new Error("OpenAI returned empty content");
  }

  return content.trim();
}

export async function summarizeContributor(evidence: EvidenceT): Promise<{ summary: string; citations: string[] }> {
  const citations = uniqueCitations(evidence);

  try {
    const llmSummary = await callChatGPT(evidence);
    if (llmSummary) {
      return { summary: llmSummary, citations };
    }
  } catch (err) {
    console.warn("LLM summarization failed, falling back to deterministic summary:", err instanceof Error ? err.message : err);
  }

  const summary = buildDeterministicSummary(evidence);
  return { summary, citations };
}
