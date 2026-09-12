"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>
          AI Architecture Review
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          AI-assisted architecture analysis using
          RepoLens metrics, dependency data,
          static-analysis findings, and selected
          source-code evidence.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <Button
          onClick={generateReview}
          disabled={loading}
        >
          {loading
            ? "Generating review..."
            : review
            ? "Regenerate Review"
            : "Generate AI Architecture Review"}
        </Button>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {review && (
          <div className="rounded-xl border bg-muted/30 p-5">
            <div className="whitespace-pre-wrap text-sm leading-7">
              {review}
            </div>
          </div>
        )}

        {evidenceFiles.length > 0 && (
          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">
                Source Evidence Used
              </h3>

              <p className="text-sm text-muted-foreground">
                RepoLens supplied source snippets
                from {evidenceFiles.length} prioritized
                file
                {evidenceFiles.length === 1
                  ? ""
                  : "s"}{" "}
                to ground the AI review.
              </p>
            </div>

            <div className="space-y-3">
              {evidenceFiles.map((file) => (
                <details
                  key={file.path}
                  className="rounded-xl border bg-background"
                >
                  <summary className="cursor-pointer p-4">
                    <div className="inline-flex flex-col gap-1">
                      <span className="font-mono text-sm font-medium">
                        {file.path}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        Complexity{" "}
                        {file.complexity}
                        {" · "}
                        Importance{" "}
                        {file.importanceScore}
                      </span>
                    </div>
                  </summary>

                  {file.sourceSnippet && (
                    <div className="border-t p-4">
                      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs leading-6">
                        <code>
                          {
                            file.sourceSnippet
                          }
                        </code>
                      </pre>
                    </div>
                  )}
                </details>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}