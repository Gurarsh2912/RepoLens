import { and, eq } from "drizzle-orm";

import Link from "next/link";
import { db } from "@/db";
import {
  analyzedFiles,
  issues,
  analyses,
} from "@/db/schema";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import AIFileReview from "@/components/repository/AIFileReview";

export default async function FilePage({
  params,
}: {
  params: Promise<{
    id: string;
    fileId: string;
  }>;
}) {
  const { id, fileId } = await params;

  const repositoryId = Number(id);
  const analyzedFileId = Number(fileId);

  const [file] = await db
    .select()
    .from(analyzedFiles)
    .where(eq(analyzedFiles.id, analyzedFileId))
    .limit(1);

  if (!file) {
    return (
      <main className="p-8">
        File not found
      </main>
    );
  }

  // Verify this file belongs to this repository
  const [analysis] = await db
    .select()
    .from(analyses)
    .where(
      and(
        eq(analyses.id, file.analysisId),
        eq(analyses.repositoryId, repositoryId)
      )
    )
    .limit(1);

  if (!analysis) {
    return (
      <main className="p-8">
        File does not belong to this repository
      </main>
    );
  }

  const fileIssues = await db
    .select()
    .from(issues)
    .where(eq(issues.fileId, analyzedFileId));

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <div className="space-y-3">
          <Link
            href={`/repository/${repositoryId}`}
            className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to repository
          </Link>

          <div className="text-sm text-muted-foreground">
            Repository
            <span className="mx-2">/</span>
            <span className="font-mono text-foreground">
              {file.path}
            </span>
          </div>
        </div>
        {/* File header */}
        <section className="rounded-2xl border bg-background p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                File analysis
              </p>

              <h1 className="mt-2 break-all font-mono text-2xl font-semibold">
                {file.path}
              </h1>

              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline">
                  {file.language ?? "Unknown"}
                </Badge>

                <Badge variant="secondary">
                  Importance {file.importanceScore ?? 0}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <MetricCard
            label="Lines of Code"
            value={file.linesOfCode ?? 0}
          />

          <MetricCard
            label="Functions"
            value={file.functionCount ?? 0}
          />

          <MetricCard
            label="Classes"
            value={file.classCount ?? 0}
          />

          <MetricCard
            label="Complexity"
            value={file.complexity ?? 0}
          />

          <MetricCard
            label="Dependencies"
            value={file.outDegree ?? 0}
          />

          <MetricCard
            label="Dependents"
            value={file.inDegree ?? 0}
          />
        </section>

        {/* Additional structure */}
        <section className="rounded-2xl border bg-background p-6">
          <h2 className="text-xl font-semibold">
            Structure
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Interfaces
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {file.interfaceCount ?? 0}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Types
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {file.typeCount ?? 0}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Parsed imports
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {file.dependencyCount ?? 0}
              </p>
            </div>
          </div>
        </section>

        {/* File issues */}
        <section className="rounded-2xl border bg-background p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Issues in this file
            </h2>

            <p className="text-sm text-muted-foreground">
              {fileIssues.length} static-analysis finding
              {fileIssues.length === 1 ? "" : "s"}.
            </p>
          </div>

          {fileIssues.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No issues detected in this file.
            </div>
          ) : (
            <div className="space-y-3">
              {fileIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {issue.message}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {issue.rule}
                        {issue.line
                          ? ` · line ${issue.line}`
                          : ""}
                      </p>
                    </div>

                    <Badge
                      variant={
                        issue.severity === "error"
                          ? "destructive"
                          : issue.severity === "warning"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AI Review */}
        <AIFileReview fileId={file.id} />
        
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">
          {label}
        </p>

        <p className="mt-2 text-3xl font-semibold">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}