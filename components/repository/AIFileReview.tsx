"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <section className="rounded-2xl border bg-background p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            AI Review
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            AI explanation based on RepoLens
            static-analysis findings.
          </p>
        </div>

        <Button
          onClick={handleGenerateReview}
          disabled={loading}
        >
          {loading
            ? "Generating..."
            : review
            ? "Regenerate Review"
            : "Generate AI Review"}
        </Button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border p-4 text-sm">
          {error}
        </div>
      )}

      {!review && !error && (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          Generate an AI review to get an
          explanation of this file&apos;s
          complexity, architecture and detected
          issues.
        </div>
      )}

      {review && (
        <div className="mt-6 space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Summary
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {review.summary}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Strengths */}
            <ReviewList
              title="Strengths"
              items={review.strengths}
            />

            {/* Concerns */}
            <ReviewList
              title="Concerns"
              items={review.concerns}
            />

            {/* Recommendations */}
            <ReviewList
              title="Recommendations"
              items={
                review.recommendations
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}

function ReviewList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None identified.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li
                key={index}
                className="text-sm leading-5 text-muted-foreground"
              >
                <span className="mr-2 text-foreground">
                  •
                </span>

                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}