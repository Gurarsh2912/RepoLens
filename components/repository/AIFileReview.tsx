"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AIReview } from "@/types/ai";

type Props = {
  fileId: number;
};

export default function AIFileReview({
  fileId,
}: Props) {
  const [review, setReview] =
    useState<AIReview | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleGenerateReview() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/ai/file-review",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            fileId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to generate AI review"
        );
      }

      setReview(data.review);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-background p-6 shadow-sm">
      {/* Action area */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">
            Source-grounded file analysis
          </p>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            RepoLens uses this file&apos;s
            deterministic metrics and
            static-analysis findings as
            context for the AI review.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleGenerateReview}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

              Generating...
            </span>
          ) : review ? (
            "Regenerate review"
          ) : (
            "Generate review"
          )}
        </Button>
      </div>

      {/* Initial state */}
      {!review &&
        !error &&
        !loading && (
          <div className="mt-6 rounded-xl border border-dashed bg-muted/10 p-6">
            <p className="text-sm font-medium">
              No AI review generated yet
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Generate a review to get an
              explanation of this file&apos;s
              complexity, dependencies,
              architecture and detected issues.
            </p>
          </div>
        )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 rounded-xl border border-dashed bg-muted/20 p-5">
          <p className="text-sm font-medium">
            Analyzing this file…
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            RepoLens is preparing the file
            context and generating a grounded
            review.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-600">
            Unable to generate review
          </p>

          <p className="mt-1 text-sm text-red-600/80">
            {error}
          </p>
        </div>
      )}

      {/* Review */}
      {review && !loading && (
        <div className="mt-8 space-y-6">
          {/* Summary */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">
                Summary
              </h3>

              <span className="rounded-full border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
                AI generated
              </span>
            </div>

            <div className="rounded-xl border bg-muted/20 p-5">
              <p className="text-sm leading-7 text-muted-foreground">
                {review.summary}
              </p>
            </div>
          </section>

          {/* Detailed review */}
          <div className="grid gap-4 lg:grid-cols-3">
            <ReviewList
              title="Strengths"
              description="Positive characteristics detected from the supplied evidence."
              items={review.strengths}
              type="strength"
            />

            <ReviewList
              title="Concerns"
              description="Areas that may deserve additional attention."
              items={review.concerns}
              type="concern"
            />

            <ReviewList
              title="Recommendations"
              description="Potential improvements suggested from the analysis."
              items={
                review.recommendations
              }
              type="recommendation"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function ReviewList({
  title,
  description,
  items,
  type,
}: {
  title: string;
  description: string;
  items?: string[];
  type:
    | "strength"
    | "concern"
    | "recommendation";
}) {
  const styles = {
    strength:
      "border-green-500/20 bg-green-500/5",

    concern:
      "border-yellow-500/20 bg-yellow-500/5",

    recommendation:
      "border-blue-500/20 bg-blue-500/5",
  };

  return (
    <section
      className={`rounded-xl border p-5 ${styles[type]}`}
    >
      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>

      {!items ||
      items.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          None identified.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map(
            (item, index) => (
              <li
                key={`${title}-${index}`}
                className="flex gap-3 text-sm leading-6"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" />

                <span className="text-muted-foreground">
                  {item}
                </span>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}