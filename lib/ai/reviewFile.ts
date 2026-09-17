import { z } from "zod";

import { buildFileContext } from "@/lib/ai/buildFileContext";
import { FILE_REVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { openRouterProvider } from "@/lib/ai/providers/openRouter";

import { AIReview } from "@/types/ai";

import { AIServiceError } from "@/lib/ai/error";

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

const aiReviewSchema = z.object({
  summary: z
    .string()
    .min(1),

  strengths: z.array(
    z.string()
  ),

  concerns: z.array(
    z.string()
  ),

  recommendations: z.array(
    z.string()
  ),
});

export async function reviewFile(
  file: FileReviewInput
): Promise<AIReview> {
  // 1. Build deterministic RepoLens context
  const context =
    buildFileContext(file);

  const messages = [
    {
      role: "system" as const,
      content:
        FILE_REVIEW_SYSTEM_PROMPT,
    },

    {
      role: "user" as const,
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
  ];

  /*
   * Give the model one additional
   * attempt if it returns malformed
   * structured output.
   */
  for (
    let attempt = 1;
    attempt <= 2;
    attempt++
  ) {
    const response =
      await openRouterProvider.generate(
        messages
      );

    try {
      return parseAIReview(
        response
      );
    } catch (error) {
      console.warn(
        `Invalid AI review format on attempt ${attempt}:`,
        error
      );

      if (attempt === 2) {
        console.error(
          "Final invalid AI response:",
          response
        );

        throw new AIServiceError({
          message:
            "The AI returned an invalid response. Please try again.",
          code: "INVALID_RESPONSE",
          status: 502,
        });
      }
    }
  }

  // TypeScript safety fallback.
  throw new Error(
    "AI review generation failed"
  );
}

function parseAIReview(
  response: string
): AIReview {
  // Remove common markdown wrappers.
  const cleaned =
    response
      .replace(
        /```json/gi,
        ""
      )
      .replace(
        /```/g,
        ""
      )
      .trim();

  // Extract only the JSON object.
  const start =
    cleaned.indexOf("{");

  const end =
    cleaned.lastIndexOf("}");

  if (
    start === -1 ||
    end === -1 ||
    end < start
  ) {
    throw new Error(
      "AI response did not contain JSON"
    );
  }

  const jsonText =
    cleaned.slice(
      start,
      end + 1
    );

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        jsonText
      );
  } catch {
    throw new Error(
      "AI response contained invalid JSON"
    );
  }

  // Runtime structure validation.
  const validation =
    aiReviewSchema.safeParse(
      parsed
    );

  if (!validation.success) {
    throw new Error(
      "AI response did not match the required review structure"
    );
  }

  return validation.data;
}