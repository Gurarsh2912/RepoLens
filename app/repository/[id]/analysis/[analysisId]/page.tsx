import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import Link from "next/link";

import { db } from "@/db";

import {
  repositories,
  analyses,
  analyzedFiles,
  issues,
} from "@/db/schema";

import RepositoryOverview from "@/components/repository/RepositoryOverview";
import ImportantFiles from "@/components/repository/ImportantFiles";
import IssueList from "@/components/repository/IssueList";

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

  // 1. Get repository
  const [repository] = await db
    .select()
    .from(repositories)
    .where(
      eq(
        repositories.id,
        repositoryId
      )
    )
    .limit(1);

  if (!repository) {
    return (
      <main className="p-8">
        Repository not found
      </main>
    );
  }

  // 2. Get requested analysis
  // Also verify it belongs to this repository
  const [analysis] = await db
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
        )
      )
    )
    .limit(1);

  if (!analysis) {
    return (
      <main className="p-8">
        Analysis not found
      </main>
    );
  }

  // 3. Get analyzed files from this exact run
  const files = await db
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

  // 4. Get issues from this exact run
  const detectedIssues =
    await db
      .select({
        id: issues.id,
        rule: issues.rule,
        severity: issues.severity,
        message: issues.message,
        line: issues.line,
        fileId: analyzedFiles.id,
        filePath: analyzedFiles.path,
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

  // 5. Severity counts for this historical run
  const severityCounts = {
    error: detectedIssues.filter(
      (issue) =>
        issue.severity === "error"
    ).length,

    warning: detectedIssues.filter(
      (issue) =>
        issue.severity === "warning"
    ).length,

    info: detectedIssues.filter(
      (issue) =>
        issue.severity === "info"
    ).length,
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 space-y-3">

          <Link
            href={`/repository/${repository.id}/analysis/${analysis.id}/compare`}
            className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
            Compare with latest
          </Link>
          <Link
            href={`/repository/${repository.id}`}
            className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to latest analysis
          </Link>

          <div>
            <p className="text-sm text-muted-foreground">
              Historical analysis
            </p>

            <h1 className="text-2xl font-semibold">
              Analysis #{analysis.id}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {analysis.createdAt.toLocaleString()}
            </p>
          </div>
        </div>

        <RepositoryOverview
          name={repository.name}
          owner={repository.owner}
          language={repository.language}
          healthScore={analysis.healthScore}
          totalFiles={analysis.totalFiles}
          totalIssues={analysis.totalIssues}
          severityCounts={
            severityCounts
          }
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
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
      </div>
    </main>
  );
}