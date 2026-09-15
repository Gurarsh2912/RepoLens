"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type EvidenceFile = {
  path: string;
  complexity: number;
  importanceScore: number;
  sourceSnippet?: string;
};

export default function AIRepositoryReview({
  repositoryId,
}: {
  repositoryId: number;
}) {
  const [review, setReview] =
    useState<string | null>(null);

  const [evidenceFiles, setEvidenceFiles] =
    useState<EvidenceFile[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function generateReview() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/ai/repository-review",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            repositoryId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to generate review"
        );
      }

      setReview(data.review);

      setEvidenceFiles(
        data.evidenceFiles ?? []
      );
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
    <div className="rounded-2xl border bg-background p-6 shadow-sm">
      {/* Top action area */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">
            Source-grounded AI analysis
          </p>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            RepoLens combines deterministic
            metrics, dependency relationships,
            static findings and selected source
            snippets before asking the model to
            interpret the architecture.
          </p>
        </div>

        <Button
          type="button"
          onClick={generateReview}
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

      {/* Loading message */}
      {loading && (
        <div className="mt-6 rounded-xl border border-dashed bg-muted/20 p-5">
          <p className="text-sm font-medium">
            Analyzing repository architecture…
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            RepoLens is preparing repository
            context and generating a grounded
            architecture review.
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

      {/* AI review */}
      {review && !loading && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                Architecture review
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                AI interpretation grounded in the
                current RepoLens analysis.
              </p>
            </div>

            <span className="rounded-full border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
              AI generated
            </span>
          </div>

          <div className="rounded-xl border bg-muted/20 p-5">
            <div className="whitespace-pre-wrap text-sm leading-7">
              {review}
            </div>
          </div>
        </section>
      )}

      {/* Evidence */}
      {evidenceFiles.length > 0 &&
        !loading && (
          <section className="mt-8 border-t pt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Source evidence
                </h3>

                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  These source snippets were
                  supplied to the model as
                  evidence for the architecture
                  review.
                </p>
              </div>

              <span className="text-xs text-muted-foreground">
                {evidenceFiles.length} file
                {evidenceFiles.length === 1
                  ? ""
                  : "s"}{" "}
                used
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {evidenceFiles.map(
                (file) => (
                  <details
                    key={file.path}
                    className="group overflow-hidden rounded-xl border bg-background"
                  >
                    <summary className="cursor-pointer list-none p-4 transition-colors hover:bg-muted/30">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-sm font-medium">
                            {file.path}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <MetricBadge
                              label="Complexity"
                              value={
                                file.complexity
                              }
                            />

                            <MetricBadge
                              label="Importance"
                              value={
                                file.importanceScore
                              }
                            />
                          </div>
                        </div>

                        <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90">
                          →
                        </span>
                      </div>
                    </summary>

                    {file.sourceSnippet ? (
                      <div className="border-t bg-muted/10 p-4">
                        <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-4 text-xs leading-6">
                          <code>
                            {
                              file.sourceSnippet
                            }
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <div className="border-t p-4 text-sm text-muted-foreground">
                        No source snippet available.
                      </div>
                    )}
                  </details>
                )
              )}
            </div>
          </section>
        )}
    </div>
  );
}

function MetricBadge({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
      {label}:{" "}
      <span className="font-medium text-foreground">
        {value}
      </span>
    </span>
  );
}