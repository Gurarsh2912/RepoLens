import {
  AIMessage,
  AIProvider,
} from "@/lib/ai/types";

type OpenRouterResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
};

// Use specific models instead of openrouter/free.
// openrouter/free may route to unsuitable models
// such as content-safety classifiers.
const MODELS = [
  "liquid/lfm-2.5-2.6b:free",
  "cohere/north-mini-code:free",
  "openai/gpt-oss-20b:free",
];

export const openRouterProvider: AIProvider = {
  async generate(
    messages: AIMessage[]
  ): Promise<string> {
    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is not configured"
      );
    }

    let lastError =
      "No OpenRouter model was available";

    for (const model of MODELS) {
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${apiKey}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              model,
              messages,
              temperature: 0.2,
            }),
          }
        );

        // Model unavailable / rate limited
        if (!response.ok) {
          const errorText =
            await response.text();

          lastError =
            `${model} failed: ${response.status} ${errorText}`;

          console.warn(
            `OpenRouter model failed: ${model}`,
            response.status
          );

          // Try next model
          continue;
        }

        const data =
          (await response.json()) as OpenRouterResponse;

        const content =
          data.choices?.[0]
            ?.message?.content
            ?.trim();

        // Empty response
        if (!content) {
          lastError =
            `${model} returned no content`;

          console.warn(
            `OpenRouter model returned no content: ${model}`
          );

          continue;
        }

        // Reject obvious classifier/safety-model output
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

    throw new Error(
      `All OpenRouter models failed. ${lastError}`
    );
  },
};