import { NextResponse } from "next/server";
import { collectEvidence, normalizeRepoUrl } from "@/lib/collector";
import { RepoInput } from "@/lib/schemas";
import { summarizeContributor } from "@/lib/summarize";

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
    const { owner, repo } = normalizeRepoUrl(repoUrl);

    const evidence = await collectEvidence({ owner, repo, login, since, until });
    const { summary, citations } = await summarizeContributor(evidence);

    return NextResponse.json({ ok: true, summary, citations, evidence });
  } catch (error) {
    console.error("Analyze error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ ok: false, error: message, stack }, { status: 500 });
  }
}
