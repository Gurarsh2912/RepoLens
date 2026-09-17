import {
  AIMessage,
  AIProvider,
} from "@/lib/ai/types";

import { AIServiceError } from "@/lib/ai/error";

type OpenRouterResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
};

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const REQUEST_TIMEOUT_MS =
  20_000;

// Ordered from most suitable
// for RepoLens code analysis
// to general fallback models.
const MODELS = [
  "cohere/north-mini-code:free",
  "openai/gpt-oss-20b:free",
  "liquid/lfm-2.5-2.6b:free",
];

export const openRouterProvider: AIProvider = {
  async generate(
    messages: AIMessage[]
  ): Promise<string> {
    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new AIServiceError({
        message:
          "AI service is not configured.",
        code: "NOT_CONFIGURED",
        status: 503,
      });
    }

    let lastError =
      "No OpenRouter model was available";

    for (const model of MODELS) {
      try {
        const response =
          await fetch(
            OPENROUTER_URL,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${apiKey}`,

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  model,
                  messages,
                  temperature: 0.2,
                }),

              signal:
                AbortSignal.timeout(
                  REQUEST_TIMEOUT_MS
                ),
            }
          );

        /*
         * Authentication problems are
         * account-level failures.
         *
         * Trying another model will not
         * fix an invalid API key.
         */
        if (
          response.status === 401
        ) {
          throw new AIServiceError({
            message:
              "AI service is temporarily unavailable.",
            code: "PROVIDER_UNAVAILABLE",
            status: 503,
          });
        }

        if (!response.ok) {
          const errorText =
            await safeErrorText(
              response
            );

          lastError =
            `${model} failed with ${response.status}` +
            (errorText
              ? `: ${errorText}`
              : "");

          console.warn(
            `OpenRouter model failed: ${model}`,
            response.status
          );

          // Try the next model.
          continue;
        }

        let data:
          OpenRouterResponse;

        try {
          data =
            (await response.json()) as OpenRouterResponse;
        } catch {
          lastError =
            `${model} returned invalid JSON`;

          console.warn(
            `OpenRouter returned invalid JSON: ${model}`
          );

          continue;
        }

        const content =
          data.choices?.[0]
            ?.message?.content
            ?.trim();

        /*
         * Successful HTTP response,
         * but unusable generation.
         */
        if (!content) {
          lastError =
            `${model} returned no content`;

          console.warn(
            `OpenRouter model returned no content: ${model}`
          );

          continue;
        }

        /*
         * Defensive check for responses
         * that clearly came from an
         * unsuitable classifier.
         */
        const normalized =
          content.toLowerCase();

        if (
          normalized.startsWith(
            "user safety:"
          )
        ) {
          lastError =
            `${model} returned an unsuitable classifier response`;

          console.warn(
            `Ignoring unsuitable response from ${model}`
          );

          continue;
        }

        console.log(
          `OpenRouter model used: ${model}`
        );

        return content;
      } catch (error) {
        /*
         * Invalid API key should stop
         * immediately because every
         * fallback will fail too.
         */
        if (
          error instanceof AIServiceError
        ) {
          throw error;
        }

        if (
          error instanceof Error &&
          (error.name ===
            "TimeoutError" ||
            error.name ===
              "AbortError")
        ) {
          lastError =
            `${model} timed out`;

          console.warn(
            `OpenRouter model timed out: ${model}`
          );

          continue;
        }

        lastError =
          error instanceof Error
            ? error.message
            : "Unknown OpenRouter error";

        console.error(
          `OpenRouter model error: ${model}`,
          error
        );
      }
    }

    console.error(
  "All OpenRouter models failed:",
  lastError
);

    throw new AIServiceError({
      message:
        "AI service is temporarily unavailable. Please try again later.",
      code: "PROVIDER_UNAVAILABLE",
      status: 503,
    });
  },
};

async function safeErrorText(
  response: Response
): Promise<string> {
  try {
    const text =
      await response.text();

    // Avoid dumping a huge provider
    // response into logs/UI.
    return text
      .slice(0, 300)
      .trim();
  } catch {
    return "";
  }
}