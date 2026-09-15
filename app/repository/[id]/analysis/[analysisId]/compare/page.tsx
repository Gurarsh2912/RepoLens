import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import Link from "next/link";

import { db } from "@/db";

import {
  analyses,
  issues,
  analyzedFiles,
} from "@/db/schema";

import { getOwnedRepository } from "@/lib/auth/getOwnedRepository";

export default async function CompareAnalysisPage({
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

  // 2. Historical analysis
  const [selectedAnalysis] =
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

  if (!selectedAnalysis) {
    return (
      <ErrorState
        title="Analysis not found"
        description="The selected analysis does not exist, is incomplete, or does not belong to this repository."
        href={`/repository/${repositoryId}`}
        linkText="← Back to repository"
      />
    );
  }

  // 3. Latest completed analysis
  const [latestAnalysis] =
    await db
      .select()
      .from(analyses)
      .where(
        and(
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
      .orderBy(
        desc(
          analyses.createdAt
        )
      )
      .limit(1);

  if (!latestAnalysis) {
    return (
      <ErrorState
        title="No latest analysis"
        description="RepoLens could not find a completed analysis to compare against."
        href={`/repository/${repositoryId}`}
        linkText="← Back to repository"
      />
    );
  }

  // 4. Previous issues
  const previousIssues =
    await db
      .select({
        rule: issues.rule,
        severity:
          issues.severity,
        message:
          issues.message,
        line:
          issues.line,
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
          selectedAnalysis.id
        )
      );

  // 5. Latest issues
  const latestIssues =
    await db
      .select({
        rule: issues.rule,
        severity:
          issues.severity,
        message:
          issues.message,
        line:
          issues.line,
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
          latestAnalysis.id
        )
      );

  // 6. Issue comparison
  const previousIssueKeys =
    new Set(
      previousIssues.map(
        (issue) =>
          issueKey(issue)
      )
    );

  const latestIssueKeys =
    new Set(
      latestIssues.map(
        (issue) =>
          issueKey(issue)
      )
    );

  const addedIssues =
    latestIssues.filter(
      (issue) =>
        !previousIssueKeys.has(
          issueKey(issue)
        )
    );

  const resolvedIssues =
    previousIssues.filter(
      (issue) =>
        !latestIssueKeys.has(
          issueKey(issue)
        )
    );

  // 7. Complexity comparison
  const previousFiles =
    await db
      .select({
        path:
          analyzedFiles.path,
        complexity:
          analyzedFiles.complexity,
      })
      .from(analyzedFiles)
      .where(
        eq(
          analyzedFiles.analysisId,
          selectedAnalysis.id
        )
      );

  const previousFileMap =
    new Map(
      previousFiles.map(
        (file) => [
          file.path,
          file.complexity ?? 0,
        ]
      )
    );

  const latestFiles =
    await db
      .select({
        path:
          analyzedFiles.path,
        complexity:
          analyzedFiles.complexity,
      })
      .from(analyzedFiles)
      .where(
        eq(
          analyzedFiles.analysisId,
          latestAnalysis.id
        )
      );

  const complexityChanges =
    latestFiles
      .filter((file) =>
        previousFileMap.has(
          file.path
        )
      )
      .map((file) => {
        const previous =
          previousFileMap.get(
            file.path
          ) ?? 0;

        const current =
          file.complexity ?? 0;

        return {
          path:
            file.path,
          previous,
          current,
          delta:
            current - previous,
        };
      })
      .filter(
        (file) =>
          file.delta !== 0
      )
      .sort(
        (a, b) =>
          Math.abs(b.delta) -
          Math.abs(a.delta)
      );

  // 8. High-level deltas
  const healthDelta =
    (latestAnalysis.healthScore ??
      0) -
    (selectedAnalysis.healthScore ??
      0);

  const fileDelta =
    (latestAnalysis.totalFiles ??
      0) -
    (selectedAnalysis.totalFiles ??
      0);

  const issueDelta =
    (latestAnalysis.totalIssues ??
      0) -
    (selectedAnalysis.totalIssues ??
      0);

  const comparingLatestToItself =
    selectedAnalysis.id ===
    latestAnalysis.id;

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href={`/repository/${repositoryId}/analysis/${selectedAnalysisId}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to analysis
          </Link>
        </div>

        {/* Header */}
        <section className="mb-10">
          <p className="text-sm font-medium text-muted-foreground">
            Repository evolution
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Analysis comparison
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Compare repository health,
            static findings and file
            complexity between a
            historical snapshot and the
            latest completed analysis.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <AnalysisBadge
              label="Selected"
              id={
                selectedAnalysis.id
              }
              date={
                selectedAnalysis.createdAt
              }
            />

            <span className="text-muted-foreground">
              →
            </span>

            <AnalysisBadge
              label="Latest"
              id={
                latestAnalysis.id
              }
              date={
                latestAnalysis.createdAt
              }
            />
          </div>
        </section>

        {comparingLatestToItself && (
          <div className="mb-8 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-medium">
              This is already the latest
              analysis
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              You are comparing the
              latest snapshot with
              itself, so no changes are
              expected.
            </p>
          </div>
        )}

        {/* Summary */}
        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              High-level changes between
              the two analysis runs.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ComparisonCard
              label="Health score"
              previous={
                selectedAnalysis.healthScore ??
                0
              }
              current={
                latestAnalysis.healthScore ??
                0
              }
              delta={
                healthDelta
              }
              positiveIsGood
            />

            <ComparisonCard
              label="Files"
              previous={
                selectedAnalysis.totalFiles ??
                0
              }
              current={
                latestAnalysis.totalFiles ??
                0
              }
              delta={
                fileDelta
              }
              neutral
            />

            <ComparisonCard
              label="Issues"
              previous={
                selectedAnalysis.totalIssues ??
                0
              }
              current={
                latestAnalysis.totalIssues ??
                0
              }
              delta={
                issueDelta
              }
              positiveIsGood={
                false
              }
            />
          </div>
        </section>

        {/* Issue evolution */}
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Issue evolution
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Findings introduced or
              resolved since the selected
              analysis.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <IssueChangeSection
              title="New issues"
              description="Issues found in the latest analysis that were not present previously."
              issues={
                addedIssues
              }
              type="new"
            />

            <IssueChangeSection
              title="Resolved issues"
              description="Issues that existed previously but are no longer detected."
              issues={
                resolvedIssues
              }
              type="resolved"
            />
          </div>
        </section>

        {/* Complexity */}
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Complexity evolution
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Complexity changes for
              files that exist in both
              analysis snapshots.
            </p>
          </div>

          <ComplexityChanges
            files={
              complexityChanges
            }
          />
        </section>
      </div>
    </main>
  );
}

function issueKey(issue: {
  rule: string;
  message: string;
  line: number | null;
  filePath: string;
}) {
  return [
    issue.filePath,
    issue.rule,
    issue.line ?? "",
    issue.message,
  ].join("|");
}

function ComparisonCard({
  label,
  previous,
  current,
  delta,
  positiveIsGood = true,
  neutral = false,
}: {
  label: string;
  previous: number;
  current: number;
  delta: number;
  positiveIsGood?: boolean;
  neutral?: boolean;
}) {
  const isGood =
    positiveIsGood
      ? delta > 0
      : delta < 0;

  const isBad =
    positiveIsGood
      ? delta < 0
      : delta > 0;

  const deltaStyle =
    neutral ||
    delta === 0
      ? "text-muted-foreground"
      : isGood
        ? "text-green-600"
        : isBad
          ? "text-red-600"
          : "text-muted-foreground";

  return (
    <div className="rounded-2xl border bg-background p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">
        {label}
      </p>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Selected
          </p>

          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {previous}
          </p>
        </div>

        <span className="text-muted-foreground">
          →
        </span>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            Latest
          </p>

          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {current}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Change
        </p>

        <p
          className={`mt-1 text-sm font-semibold ${deltaStyle}`}
        >
          {delta > 0
            ? `+${delta}`
            : delta}
        </p>
      </div>
    </div>
  );
}

function IssueChangeSection({
  title,
  description,
  issues,
  type,
}: {
  title: string;
  description: string;

  issues: {
    rule: string;
    severity: string;
    message: string;
    line: number | null;
    filePath: string;
  }[];

  type:
    | "new"
    | "resolved";
}) {
  return (
    <div className="rounded-2xl border bg-background p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            {title}
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
            type === "new"
              ? "border-red-500/20 bg-red-500/5 text-red-600"
              : "border-green-500/20 bg-green-500/5 text-green-600"
          }`}
        >
          {issues.length}
        </span>
      </div>

      {issues.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {type === "new"
              ? "No new issues detected."
              : "No resolved issues detected."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {issues.map(
            (issue, index) => (
              <div
                key={`${issueKey(
                  issue
                )}-${index}`}
                className="rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <SeverityBadge
                        severity={
                          issue.severity
                        }
                      />

                      <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                        {issue.rule}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium leading-6">
                      {issue.message}
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                      {
                        issue.filePath
                      }

                      {issue.line
                        ? ` · line ${issue.line}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function ComplexityChanges({
  files,
}: {
  files: {
    path: string;
    previous: number;
    current: number;
    delta: number;
  }[];
}) {
  return (
    <div className="rounded-2xl border bg-background p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Changed files
        </p>

        <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
          {files.length}
        </span>
      </div>

      {files.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">
            No complexity changes
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Complexity stayed the same
            for files present in both
            analyses.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {files.map(
            (file) => {
              const improved =
                file.delta < 0;

              return (
                <div
                  key={
                    file.path
                  }
                  className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="min-w-0 break-all font-mono text-sm font-medium">
                    {file.path}
                  </p>

                  <div className="flex shrink-0 items-center gap-3 text-sm">
                    <span className="rounded-md border px-2 py-1">
                      {
                        file.previous
                      }
                    </span>

                    <span className="text-muted-foreground">
                      →
                    </span>

                    <span className="rounded-md border px-2 py-1">
                      {
                        file.current
                      }
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        improved
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {file.delta >
                      0
                        ? `+${file.delta}`
                        : file.delta}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
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
      : severity ===
          "warning"
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

function AnalysisBadge({
  label,
  id,
  date,
}: {
  label: string;
  id: number;
  date: Date;
}) {
  return (
    <div className="rounded-xl border bg-background px-4 py-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        Analysis #{id}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {new Date(
          date
        ).toLocaleString()}
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