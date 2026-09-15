import {
  eq,
  desc,
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
import AIRepositoryReview from "@/components/repository/AIRepositoryReview";
import AnalysisHistory from "@/components/repository/AnalysisHistory";

import { getOwnedRepository } from "@/lib/auth/getOwnedRepository";

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const repositoryId =
    Number(id);

  // 1. Get repository and verify ownership
  const repository =
    await getOwnedRepository(
      repositoryId
    );

  if (!repository) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-2xl border bg-background p-10 text-center">
            <h1 className="text-xl font-semibold">
              Repository not found
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              This repository does not
              exist or you do not have
              access to it.
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-flex rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 2. Get all analysis attempts
  const analysisHistory =
    await db
      .select()
      .from(analyses)
      .where(
        eq(
          analyses.repositoryId,
          repository.id
        )
      )
      .orderBy(
        desc(
          analyses.createdAt
        )
      );

  // Latest successfully completed analysis
  const analysis =
    analysisHistory.find(
      (item) =>
        item.status ===
        "completed"
    );

  if (!analysis) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Dashboard
          </Link>

          <div className="mt-8 rounded-2xl border bg-background p-10 text-center">
            <h1 className="text-xl font-semibold">
              No completed analysis
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              RepoLens has not completed
              an analysis for this
              repository yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 3. Get analyzed files
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

  // 4. Get issues
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

  // 5. Severity summary
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
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Repository header */}
        <section className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {repository.name}
              </h1>

              {repository.language && (
                <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                  {
                    repository.language
                  }
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {repository.owner}/
              {repository.name}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {repository.defaultBranch && (
                <span>
                  Branch:{" "}
                  <span className="font-medium text-foreground">
                    {
                      repository.defaultBranch
                    }
                  </span>
                </span>
              )}

              <span>
                Analysis #
                {analysis.id}
              </span>

              <span>
                {new Date(
                  analysis.createdAt
                ).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Repository actions */}
          <div className="flex flex-wrap gap-3">
            <a
              href={
                repository.githubUrl
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              GitHub ↗
            </a>

            <Link
              href={`/repository/${repository.id}/architecture`}
              className="inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              View architecture →
            </Link>
          </div>
        </section>

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

        {/* Main analysis */}
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Codebase analysis
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Explore important modules
              and static-analysis
              findings from the latest
              completed run.
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

        {/* AI Review */}
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              AI architecture review
            </h2>

            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Generate a source-grounded
              explanation of the
              repository architecture,
              coupling, maintainability
              risks and potential
              refactoring opportunities.
            </p>
          </div>

          <AIRepositoryReview
            repositoryId={
              repository.id
            }
          />
        </section>

        {/* History */}
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Analysis history
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Track how repository
              health, issues and
              complexity change over
              time.
            </p>
          </div>

          <AnalysisHistory
            repositoryId={
              repository.id
            }
            analyses={
              analysisHistory
            }
            currentAnalysisId={
              analysis.id
            }
          />
        </section>
      </div>
    </main>
  );
}