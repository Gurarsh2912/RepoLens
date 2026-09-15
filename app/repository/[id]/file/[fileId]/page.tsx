import { and, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";

import {
  analyzedFiles,
  issues,
  analyses,
} from "@/db/schema";

import AIFileReview from "@/components/repository/AIFileReview";

import { getOwnedRepository } from "@/lib/auth/getOwnedRepository";

export default async function FilePage({
  params,
}: {
  params: Promise<{
    id: string;
    fileId: string;
  }>;
}) {
  const { id, fileId } =
    await params;

  const repositoryId =
    Number(id);

  const analyzedFileId =
    Number(fileId);

  // 1. Verify repository ownership
  const repository =
    await getOwnedRepository(
      repositoryId
    );

  if (!repository) {
    return (
      <ErrorState
        title="Repository not found"
        description="This repository does not exist or you do not have access to it."
        href="/dashboard"
        linkText="← Back to dashboard"
      />
    );
  }

  // 2. Get analyzed file
  const [file] = await db
    .select()
    .from(analyzedFiles)
    .where(
      eq(
        analyzedFiles.id,
        analyzedFileId
      )
    )
    .limit(1);

  if (!file) {
    return (
      <ErrorState
        title="File not found"
        description="RepoLens could not find this analyzed file."
        href={`/repository/${repositoryId}`}
        linkText="← Back to repository"
      />
    );
  }

  // 3. Verify file belongs to this repository
  const [analysis] =
    await db
      .select()
      .from(analyses)
      .where(
        and(
          eq(
            analyses.id,
            file.analysisId
          ),
          eq(
            analyses.repositoryId,
            repositoryId
          )
        )
      )
      .limit(1);

  if (!analysis) {
    return (
      <ErrorState
        title="File unavailable"
        description="This file does not belong to the selected repository."
        href={`/repository/${repositoryId}`}
        linkText="← Back to repository"
      />
    );
  }

  // 4. Get issues for this file
  const fileIssues =
    await db
      .select()
      .from(issues)
      .where(
        eq(
          issues.fileId,
          analyzedFileId
        )
      );

  const issueCounts = {
    error:
      fileIssues.filter(
        (issue) =>
          issue.severity === "error"
      ).length,

    warning:
      fileIssues.filter(
        (issue) =>
          issue.severity === "warning"
      ).length,

    info:
      fileIssues.filter(
        (issue) =>
          issue.severity === "info"
      ).length,
  };

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href={`/repository/${repositoryId}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to repository
          </Link>
        </div>

        {/* File header */}
        <section className="rounded-2xl border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                File analysis
              </p>

              <h1 className="mt-3 break-all font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                {file.path}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <InfoBadge>
                  {file.language ??
                    "Unknown"}
                </InfoBadge>

                <InfoBadge>
                  Analysis #
                  {analysis.id}
                </InfoBadge>

                <InfoBadge>
                  Importance{" "}
                  {file.importanceScore ??
                    0}
                </InfoBadge>
              </div>
            </div>

            {/* Issue summary */}
            <div className="flex flex-wrap gap-2">
              <SeveritySummary
                label="Errors"
                value={
                  issueCounts.error
                }
                type="error"
              />

              <SeveritySummary
                label="Warnings"
                value={
                  issueCounts.warning
                }
                type="warning"
              />

              <SeveritySummary
                label="Info"
                value={
                  issueCounts.info
                }
                type="info"
              />
            </div>
          </div>
        </section>

        {/* Main metrics */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              File metrics
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Structural and dependency
              metrics calculated during
              analysis.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              label="Lines of code"
              value={
                file.linesOfCode ?? 0
              }
            />

            <MetricCard
              label="Functions"
              value={
                file.functionCount ?? 0
              }
            />

            <MetricCard
              label="Classes"
              value={
                file.classCount ?? 0
              }
            />

            <MetricCard
              label="Complexity"
              value={
                file.complexity ?? 0
              }
              highlight={
                (file.complexity ??
                  0) > 15
              }
            />

            <MetricCard
              label="Dependencies"
              value={
                file.outDegree ?? 0
              }
            />

            <MetricCard
              label="Dependents"
              value={
                file.inDegree ?? 0
              }
            />
          </div>
        </section>

        {/* Structure */}
        <section className="mt-10 rounded-2xl border bg-background p-6">
          <div>
            <h2 className="text-xl font-semibold">
              File structure
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              AST-derived structural
              information detected in
              this file.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StructureMetric
              label="Interfaces"
              value={
                file.interfaceCount ??
                0
              }
            />

            <StructureMetric
              label="Type aliases"
              value={
                file.typeCount ?? 0
              }
            />

            <StructureMetric
              label="Parsed imports"
              value={
                file.dependencyCount ??
                0
              }
            />
          </div>
        </section>

        {/* Issues */}
        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Issues in this file
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Static-analysis
                findings detected for
                this file.
              </p>
            </div>

            <span className="text-sm text-muted-foreground">
              {fileIssues.length}{" "}
              finding
              {fileIssues.length === 1
                ? ""
                : "s"}
            </span>
          </div>

          <div className="rounded-2xl border bg-background p-6">
            {fileIssues.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="font-medium">
                  No issues detected
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  RepoLens did not
                  detect any static
                  analysis issues in
                  this file.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {fileIssues.map(
                  (issue) => (
                    <div
                      key={issue.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <SeverityBadge
                              severity={
                                issue.severity
                              }
                            />

                            <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                              {
                                issue.rule
                              }
                            </span>
                          </div>

                          <p className="mt-3 text-sm font-medium leading-6">
                            {
                              issue.message
                            }
                          </p>

                          {issue.line && (
                            <p className="mt-2 font-mono text-xs text-muted-foreground">
                              Line{" "}
                              {
                                issue.line
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* AI Review */}
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              AI file review
            </h2>

            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Generate an AI
              explanation grounded in
              this file&apos;s
              deterministic RepoLens
              metrics and
              static-analysis
              findings.
            </p>
          </div>

          <AIFileReview
            fileId={file.id}
          />
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-background p-5 ${
        highlight
          ? "border-yellow-500/30 bg-yellow-500/5"
          : ""
      }`}
    >
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function StructureMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-muted/10 p-4">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function InfoBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border bg-muted/20 px-3 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: string;
}) {
  const styles =
    severity === "error"
      ? "border-red-500/20 bg-red-500/5 text-red-600"
      : severity === "warning"
        ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-600"
        : "border-blue-500/20 bg-blue-500/5 text-blue-600";

  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {severity}
    </span>
  );
}

function SeveritySummary({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type:
    | "error"
    | "warning"
    | "info";
}) {
  const styles = {
    error:
      "border-red-500/20 bg-red-500/5 text-red-600",

    warning:
      "border-yellow-500/20 bg-yellow-500/5 text-yellow-600",

    info:
      "border-blue-500/20 bg-blue-500/5 text-blue-600",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${styles[type]}`}
    >
      <p className="text-xs">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function ErrorState({
  title,
  description,
  href,
  linkText,
}: {
  title: string;
  description: string;
  href: string;
  linkText: string;
}) {
  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl border bg-background p-10 text-center">
          <h1 className="text-xl font-semibold">
            {title}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>

          <Link
            href={href}
            className="mt-6 inline-flex rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {linkText}
          </Link>
        </div>
      </div>
    </main>
  );
}