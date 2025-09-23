import { z } from "zod";

export const RepoInput = z.object({
  repoUrl: z.string().url(),
  login: z.string().min(1),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional()
});

export const Evidence = z.object({
  repo: z.string(),
  login: z.string(),
  window: z.object({ since: z.string(), until: z.string() }),
  prs: z.array(
    z.object({
      number: z.number(),
      url: z.string().url(),
      title: z.string(),
      createdAt: z.string(),
      mergedAt: z.string().nullable(),
      labels: z.array(z.string()).optional(),
      files: z.array(z.string()).optional(),
      reviews: z
        .array(
          z.object({
            author: z.string(),
            state: z.string(),
            body: z.string().optional(),
            submittedAt: z.string()
          })
        )
        .optional()
    })
  ),
  commits: z.array(
    z.object({
      sha: z.string(),
      url: z.string().url(),
      message: z.string(),
      committedDate: z.string(),
      additions: z.number().optional(),
      deletions: z.number().optional(),
      files: z
        .array(
          z.object({
            filename: z.string(),
            status: z.string(),
            previous_filename: z.string().optional()
          })
        )
        .optional()
    })
  ),
  reviewsGiven: z.array(
    z.object({
      prNumber: z.number(),
      url: z.string().url(),
      state: z.string(),
      body: z.string().optional(),
      submittedAt: z.string()
    })
  )
});

export type EvidenceT = z.infer<typeof Evidence>;
export type RepoInputT = z.infer<typeof RepoInput>;
