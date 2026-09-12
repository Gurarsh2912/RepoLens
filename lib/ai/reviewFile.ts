import { buildFileContext } from "@/lib/ai/buildFileContext";
import { FILE_REVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { openRouterProvider } from "@/lib/ai/providers/openRouter";

import { AIReview } from "@/types/ai";

type FileReviewInput = {
  path: string;
  language: string | null;

  linesOfCode: number;
  complexity: number;

  functionCount: number;
  classCount: number;

  dependencies: number;
  dependents: number;

  importanceScore: number;

  issues: {
    rule: string;
    severity: string;
    message: string;
    line: number | null;
  }[];
};

export async function reviewFile(
  file: FileReviewInput
): Promise<AIReview> {
  // 1. Convert our deterministic analysis into compact text
  const context = buildFileContext(file);

  // 2. Ask AI to return structured JSON
  const response = await openRouterProvider.generate([
    {
      role: "system",
      content: FILE_REVIEW_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `
Analyze the following RepoLens file analysis.

${context}

Return ONLY valid JSON in this exact shape:

{
  "summary": "short explanation",
  "strengths": [
    "strength 1"
  ],
  "concerns": [
    "concern 1"
  ],
  "recommendations": [
    "recommendation 1"
  ]
}

Do not include markdown.
Do not include code fences.
Do not invent issues that are not supported by the supplied analysis.
      `.trim(),
    },
  ]);

// 3. Parse AI JSON safely
try {
  const cleaned = response
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error(
      "AI response did not contain JSON"
    );
  }

  const jsonText = cleaned.slice(
    start,
    end + 1
  );

  const review =
    JSON.parse(jsonText) as AIReview;

    return review;
  } catch {
    console.error(
      "Invalid AI response:",
      response
    );

    throw new Error(
      "AI returned an invalid review format"
    );
  }
}