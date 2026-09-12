import { buildRepositoryContext } from "@/lib/ai/buildRepositoryContext";
import {
  REPOSITORY_REVIEW_SYSTEM_PROMPT,
  buildRepositoryReviewPrompt,
} from "@/lib/ai/prompts";

import { openRouterProvider } from "@/lib/ai/providers/openRouter";

export async function reviewRepository(
  repositoryId: number
) {
  // 1. Build repository context
  const context =
    await buildRepositoryContext(
      repositoryId
    );

  // 2. Build repository-specific prompt
  const userPrompt =
    buildRepositoryReviewPrompt(
      context
    );

  // 3. Send messages through provider abstraction
  const review =
    await openRouterProvider.generate([
      {
        role: "system",
        content:
          REPOSITORY_REVIEW_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ]);
  
  const evidenceFiles =
    context.importantFiles
      .filter(
        (file) =>
          Boolean(file.sourceSnippet)
      )
      .map((file) => ({
        path: file.path,
        complexity: file.complexity,
        importanceScore:
          file.importanceScore,
        sourceSnippet:
          file.sourceSnippet,
      }));

  // 4. Return generated review
  return {
    review, 
    evidenceFiles,  
  };
}