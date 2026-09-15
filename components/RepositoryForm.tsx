"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RepositoryForm() {
  const [githubUrl, setGithubUrl] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const router = useRouter();

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const trimmedUrl =
      githubUrl.trim();

    if (!trimmedUrl) {
      setError(
        "Enter a GitHub repository URL."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/repositories",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            githubUrl:
              trimmedUrl,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Repository analysis failed."
        );

        return;
      }

      router.push(
        `/repository/${data.repository.id}`
      );
    } catch {
      setError(
        "Unable to analyze the repository. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            type="url"
            placeholder="https://github.com/user/repository"
            value={githubUrl}
            disabled={loading}
            aria-invalid={
              error ? true : undefined
            }
            onChange={(e) => {
              setGithubUrl(
                e.target.value
              );

              if (error) {
                setError("");
              }
            }}
            className="h-11"
          />
        </div>

        <Button
          type="submit"
          disabled={
            loading ||
            !githubUrl.trim()
          }
          className="h-11 min-w-32"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

              Analyzing...
            </span>
          ) : (
            "Analyze repository"
          )}
        </Button>
      </div>

      {loading && (
        <p className="mt-3 text-sm text-muted-foreground">
          Fetching and analyzing the
          repository. This may take a few
          moments.
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-600">
            {error}
          </p>
        </div>
      )}
    </form>
  );
}