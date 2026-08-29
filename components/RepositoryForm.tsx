"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RepositoryForm() {
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/repositories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          githubUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.push(`/repository/${data.repository.id}`);
    } catch {
      setError("Failed to submit repository");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xl gap-3"
    >
      <Input
        type="url"
        placeholder="https://github.com/user/repository"
        value={githubUrl}
        onChange={(e) => setGithubUrl(e.target.value)}
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Analyze"}
      </Button>

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
    </form>
  );
}