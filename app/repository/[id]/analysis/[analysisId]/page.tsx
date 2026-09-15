import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import Link from "next/link";

import { db } from "@/db";

import {
  analyses,
  analyzedFiles,
  issues,
} from "@/db/schema";

import RepositoryOverview from "@/components/repository/RepositoryOverview";
import ImportantFiles from "@/components/repository/ImportantFiles";
import IssueList from "@/components/repository/IssueList";

import { getOwnedRepository } from "@/lib/auth/getOwnedRepository";

export default async function HistoricalAnalysisPage({
  params,
}: {
  params: Promise<{
    id: string;
    analysisId: string;
  }>;
}) {
  const { id, analysisId } =
    await params;

  const repositoryId =
    Number(id);

  const selectedAnalysisId =
    Number(analysisId);

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

  // 2. Get requested completed analysis
  const [analysis] =
    await db
      .select()
      .from(analyses)
      .where(
        and(
          eq(
            analyses.id,
            selectedAnalysisId
          ),

          eq(
            analyses.repositoryId,
            repositoryId
          ),

          eq(
            analyses.status,
            "completed"
          )
        )
      )
      .limit(1);

  if (!analysis) {
    return (
      <ErrorState
        title="Analysis not found"
        description="This analysis does not exist, is incomplete, or does not belong to this repository."
        href={`/repository/${repositoryId}`}
        linkText="← Back to repository"
      />
    );
  }

  // 3. Files from this exact analysis
  const files =
    await db
      .select()
      .from(analyzedFiles)
      .where(
        eq(
          analyzedFiles.analysisId,
          analysis.id
        )
      )
      .orderBy(
        desc(
          analyzedFiles.importanceScore
        )
      );

  // 4. Issues from this exact analysis
  const detectedIssues =
    await db
      .select({
        id:
          issues.id,

        rule:
          issues.rule,

        severity:
          issues.severity,

        message:
          issues.message,

        line:
          issues.line,

        fileId:
          analyzedFiles.id,

        filePath:
          analyzedFiles.path,
      })
      .from(issues)
      .innerJoin(
        analyzedFiles,
        eq(
          issues.fileId,
          analyzedFiles.id
        )
      )
      .where(
        eq(
          issues.analysisId,
          analysis.id
        )
      );

  // 5. Severity counts
  const severityCounts = {
    error:
      detectedIssues.filter(
        (issue) =>
          issue.severity ===
          "error"
      ).length,

    warning:
      detectedIssues.filter(
        (issue) =>
          issue.severity ===
          "warning"
      ).length,

    info:
      detectedIssues.filter(
        (issue) =>
          issue.severity ===
          "info"
      ).length,
  };

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href={`/repository/${repository.id}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to latest analysis
          </Link>
        </div>

        {/* Historical analysis header */}
        <section className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Historical snapshot
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Analysis #{analysis.id}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {repository.owner}/
              {repository.name}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <InfoBadge>
                Completed
              </InfoBadge>

              <InfoBadge>
                {new Date(
                  analysis.createdAt
                ).toLocaleString()}
              </InfoBadge>

              {repository.language && (
                <InfoBadge>
                  {repository.language}
                </InfoBadge>
              )}
            </div>
          </div>

          <Link
            href={`/repository/${repository.id}/analysis/${analysis.id}/compare`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Compare with latest →
          </Link>
        </section>

        {/* Historical notice */}
        <div className="mb-8 rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
          <p className="text-sm font-medium">
            Historical analysis
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            You are viewing an immutable
            snapshot from a previous
            RepoLens analysis. Metrics and
            findings below represent the
            repository at that analysis
            point.
          </p>
        </div>

        {/* Overview */}
        <RepositoryOverview
          healthScore={
            analysis.healthScore
          }
          totalFiles={
            analysis.totalFiles
          }
          totalIssues={
            analysis.totalIssues
          }
          severityCounts={
            severityCounts
          }
        />

        {/* Historical findings */}
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Snapshot findings
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Important files and
              static-analysis findings
              captured during this
              analysis run.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <ImportantFiles
              repositoryId={
                repository.id
              }
              files={files}
            />

            <IssueList
              repositoryId={
                repository.id
              }
              issues={
                detectedIssues
              }
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
      {children}
    </span>
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