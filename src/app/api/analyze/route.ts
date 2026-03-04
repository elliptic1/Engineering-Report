import { NextResponse } from "next/server";
import { collectEvidence, normalizeRepoUrl } from "@/lib/collector";
import { RepoInput } from "@/lib/schemas";
import { summarizeContributor } from "@/lib/summarize";
import { getUsage, isAtLimit, incrementUsage } from "@/lib/usage";
import type { UserTier } from "@/lib/usage";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validation = RepoInput.safeParse(payload);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { repoUrl, login, since, until } = validation.data;
    const userId = (payload as Record<string, unknown>).userId as string | undefined;

    // Determine tier and enforce usage limits when a userId is provided
    let tier: UserTier = "free";
    if (userId) {
      const atLimit = await isAtLimit(userId);
      if (atLimit) {
        return NextResponse.json(
          { ok: false, error: "Monthly analysis limit reached. Upgrade to Pro for more." },
          { status: 429 }
        );
      }
      const usage = await getUsage(userId);
      tier = usage.tier;
    }

    const { owner, repo } = normalizeRepoUrl(repoUrl);
    const evidence = await collectEvidence({ owner, repo, login, since, until });
    const { summary, citations } = await summarizeContributor(evidence, tier);

    // Track usage after successful analysis
    if (userId) {
      await incrementUsage(userId).catch((err) =>
        console.warn("Failed to increment usage:", err instanceof Error ? err.message : err)
      );
    }

    return NextResponse.json({ ok: true, summary, citations, evidence });
  } catch (error) {
    console.error("Analyze error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ ok: false, error: message, stack }, { status: 500 });
  }
}
