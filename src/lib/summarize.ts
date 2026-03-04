import { EvidenceT } from "./schemas";
import { isTestPath } from "./text";
import type { UserTier } from "./usage";

/* ------------------------------------------------------------------ */
/*  Model configuration per tier                                       */
/* ------------------------------------------------------------------ */

const MODELS = {
  free: "gpt-4o-mini",
  pro: {
    writer: "gpt-4o",
    editor: "gpt-4o",
    recruiter: "gpt-4o",
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Deterministic (template) summary — fallback for all tiers          */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  OpenAI helpers                                                     */
/* ------------------------------------------------------------------ */

function buildEvidencePayload(evidence: EvidenceT): string {
  return JSON.stringify(
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
}

async function chatCompletion(
  model: string,
  systemPrompt: string,
  userMessage: string,
  temperature: number = 0.3,
  maxTokens: number = 1500
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature,
      max_tokens: maxTokens
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

/* ------------------------------------------------------------------ */
/*  Free tier: single-pass cheap model                                 */
/* ------------------------------------------------------------------ */

const FREE_SYSTEM_PROMPT = [
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

async function summarizeFree(evidence: EvidenceT): Promise<string> {
  return chatCompletion(
    MODELS.free,
    FREE_SYSTEM_PROMPT,
    buildEvidencePayload(evidence),
    0.3,
    1500
  );
}

/* ------------------------------------------------------------------ */
/*  Pro tier: three-pass pipeline (writer → editor → recruiter)        */
/* ------------------------------------------------------------------ */

const PRO_WRITER_PROMPT = [
  "You are a senior engineering manager writing a sprint contributor summary.",
  "You have years of experience leading engineering teams and know exactly what matters in a performance review.",
  "Write from your own perspective — like you personally reviewed this person's work.",
  "",
  "Given the contributor's GitHub activity below, write a detailed markdown summary with these sections:",
  "",
  "## Headline",
  "One strong sentence that captures their biggest win this sprint. Write it like you'd say it in a team standup.",
  "",
  "### Key impacts",
  "Bullet the most meaningful work. Reference PR numbers and commit SHAs. Explain WHY each matters, not just what changed.",
  "",
  "### Collaboration & review notes",
  "How did they show up for the team? Mention specific reviews, unblocking moments, or pairing sessions.",
  "",
  "### Engineering signals",
  "What does their work tell you about their engineering judgment? Test coverage, cleanup, careful refactoring — call it out.",
  "",
  "### Growth & coaching",
  "One or two specific, actionable growth areas based on what you see in the evidence. Be direct but constructive.",
  "",
  "### Next-sprint suggestions",
  "What should they focus on next? Base this on patterns in their current work.",
  "",
  "Important:",
  "- Only reference data present in the evidence. Never make things up.",
  "- Write like a real person, not a template. Vary your sentence structure.",
  "- Be specific. Vague praise is worse than no praise."
].join("\n");

const PRO_EDITOR_PROMPT = [
  "You are a writing editor who specializes in making business documents sound natural and human.",
  "You've been given a contributor summary written by an engineering manager.",
  "",
  "Your job is to edit this summary so it reads like a real person wrote it — not an AI.",
  "",
  "Rules:",
  "- Keep the exact same markdown structure (## Headline, ### Key impacts, etc.).",
  "- Keep all PR numbers, commit SHAs, and technical facts exactly as they are.",
  "- Break up any robotic patterns: vary sentence length, mix short punchy lines with longer ones.",
  "- Replace generic filler ('demonstrated strong ownership', 'exhibited leadership') with concrete language.",
  "- Add small natural touches — contractions, the occasional informal phrasing, a dash instead of a semicolon.",
  "- Cut anything that sounds like boilerplate. If a bullet doesn't add real information, rewrite or remove it.",
  "- The tone should feel like a thoughtful manager who actually knows this person's work.",
  "- Do NOT add new information. Only reshape what's already there.",
  "",
  "Return the full edited summary in markdown."
].join("\n");

const PRO_RECRUITER_PROMPT = [
  "You are a technical recruiter who reads engineering summaries to understand what people actually accomplished.",
  "You know the difference between fluff and substance.",
  "",
  "You've been given an edited contributor summary. Give it one final polish:",
  "",
  "- Make sure every sentence earns its place. Cut dead weight.",
  "- If anything still sounds like generic AI output ('notable contributions', 'key takeaway'), reword it to be specific.",
  "- Make the headline punchy — something you'd actually remember after reading 20 of these.",
  "- Ensure the growth and coaching section sounds like real advice from someone who cares, not a form letter.",
  "- Tighten the language overall. Managers are busy — respect their time.",
  "- Keep the markdown structure intact (## Headline, ### Key impacts, etc.).",
  "- Keep all PR numbers, commit SHAs, and technical facts exactly as they are.",
  "- Do NOT add new information or change any technical details.",
  "",
  "Return the final polished summary in markdown."
].join("\n");

async function summarizePro(evidence: EvidenceT): Promise<string> {
  const evidencePayload = buildEvidencePayload(evidence);

  // Pass 1: Writer — generate the raw summary with a top-tier model
  const writerDraft = await chatCompletion(
    MODELS.pro.writer,
    PRO_WRITER_PROMPT,
    evidencePayload,
    0.5,
    2000
  );

  // Pass 2: Editor — humanize the tone and remove AI patterns
  const editedDraft = await chatCompletion(
    MODELS.pro.editor,
    PRO_EDITOR_PROMPT,
    writerDraft,
    0.6,
    2000
  );

  // Pass 3: Recruiter — final polish for punch and clarity
  const finalSummary = await chatCompletion(
    MODELS.pro.recruiter,
    PRO_RECRUITER_PROMPT,
    editedDraft,
    0.4,
    2000
  );

  return finalSummary;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function summarizeContributor(
  evidence: EvidenceT,
  tier: UserTier = "free"
): Promise<{ summary: string; citations: string[] }> {
  const citations = uniqueCitations(evidence);

  try {
    const llmSummary = tier === "pro"
      ? await summarizePro(evidence)
      : await summarizeFree(evidence);
    if (llmSummary) {
      return { summary: llmSummary, citations };
    }
  } catch (err) {
    console.warn(
      `LLM summarization failed (tier=${tier}), falling back to deterministic summary:`,
      err instanceof Error ? err.message : err
    );
  }

  const summary = buildDeterministicSummary(evidence);
  return { summary, citations };
}
