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
  issues,
  analyzedFiles,
} from "@/db/schema";

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

  // 2. Get selected historical analysis
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
          )
        )
      )
      .limit(1);

  if (!selectedAnalysis) {
    return (
      <main className="p-8">
        Analysis not found
      </main>
    );
  }

  // 3. Get latest completed analysis
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
      <main className="p-8">
        No latest analysis found
      </main>
    );
  }

  // 4. Get issues from previous analysis
  const previousIssues = await db
    .select({
      rule: issues.rule,
      severity: issues.severity,
      message: issues.message,
      line: issues.line,
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
        selectedAnalysis.id
      )
    );

  // 5. Get issues from latest analysis
  const latestIssues = await db
    .select({
      rule: issues.rule,
      severity: issues.severity,
      message: issues.message,
      line: issues.line,
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
        latestAnalysis.id
      )
    );

  // 6. Create stable keys for issue comparison
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

  // Issues present now but not before
  const addedIssues =
    latestIssues.filter(
      (issue) =>
        !previousIssueKeys.has(
          issueKey(issue)
        )
    );

  // Issues present before but not now
  const resolvedIssues =
    previousIssues.filter(
      (issue) =>
        !latestIssueKeys.has(
          issueKey(issue)
        )
    );

    const previousFiles = await db
    .select({
        path: analyzedFiles.path,
        complexity: analyzedFiles.complexity,
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
        previousFiles.map((file) => [
        file.path,
        file.complexity ?? 0,
        ])
    );

    const latestFiles = await db
    .select({
        path: analyzedFiles.path,
        complexity: analyzedFiles.complexity,
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
        previousFileMap.has(file.path)
        )
        .map((file) => {
        const previous =
            previousFileMap.get(
            file.path
            ) ?? 0;

        const current =
            file.complexity ?? 0;

        return {
            path: file.path,
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

  // 7. Calculate high-level deltas
  const healthDelta =
    (latestAnalysis.healthScore ?? 0) -
    (selectedAnalysis.healthScore ?? 0);

  const fileDelta =
    (latestAnalysis.totalFiles ?? 0) -
    (selectedAnalysis.totalFiles ?? 0);

  const issueDelta =
    (latestAnalysis.totalIssues ?? 0) -
    (selectedAnalysis.totalIssues ?? 0);

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
        <section className="rounded-2xl border bg-background p-6">
        <div>
            <h2 className="text-xl font-semibold">
            Complexity Changes
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
            Files whose complexity changed between the
            selected analysis and the latest analysis.
            </p>
        </div>

        {files.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            No complexity changes detected.
            </div>
        ) : (
            <div className="mt-5 space-y-3">
            {files.map((file) => (
                <div
                key={file.path}
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                <p className="break-all font-mono text-sm">
                    {file.path}
                </p>

                <div className="flex items-center gap-3 text-sm">
                    <span>{file.previous}</span>

                    <span className="text-muted-foreground">
                    →
                    </span>

                    <span>{file.current}</span>

                    <span
                    className={
                        file.delta < 0
                        ? "font-medium text-green-600"
                        : "font-medium text-red-600"
                    }
                    >
                    {file.delta > 0
                        ? `+${file.delta}`
                        : file.delta}
                    </span>
                </div>
                </div>
            ))}
            </div>
        )}
        </section>
    );
    }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <Link
            href={`/repository/${repositoryId}/analysis/${selectedAnalysisId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to analysis
          </Link>

          <h1 className="mt-4 text-3xl font-semibold">
            Analysis Comparison
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Comparing Analysis #
            {selectedAnalysis.id}
            {" "}with latest Analysis #
            {latestAnalysis.id}.
          </p>
        </div>

        {/* High-level comparison */}
        <div className="grid gap-4 md:grid-cols-3">
          <ComparisonCard
            label="Health Score"
            previous={
              selectedAnalysis.healthScore ??
              0
            }
            current={
              latestAnalysis.healthScore ??
              0
            }
            delta={healthDelta}
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
            delta={fileDelta}
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
            delta={issueDelta}
          />
        </div>

        {/* Issue comparison */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <IssueChangeSection
            title="New Issues"
            description="Issues found in the latest analysis that were not present in the selected analysis."
            issues={addedIssues}
        />

        <IssueChangeSection
            title="Resolved Issues"
            description="Issues that existed in the selected analysis but are no longer present."
            issues={resolvedIssues}
        />
        </div>

        {/* Complexity comparison */}
        <div className="mt-10">
        <ComplexityChanges
            files={complexityChanges}
        />
        </div>
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
}: {
  label: string;
  previous: number;
  current: number;
  delta: number;
}) {
  return (
    <div className="rounded-2xl border bg-background p-6">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Previous
          </p>

          <p className="text-2xl font-semibold">
            {previous}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Latest
          </p>

          <p className="text-2xl font-semibold">
            {current}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm">
        Change:{" "}
        <span className="font-medium">
          {delta > 0
            ? `+${delta}`
            : delta}
        </span>
      </p>
    </div>
  );
}

function IssueChangeSection({
  title,
  description,
  issues,
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
}) {
  return (
    <section className="rounded-2xl border bg-background p-6">
      <div>
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>

        <p className="mt-2 text-sm font-medium">
          {issues.length} issue
          {issues.length === 1
            ? ""
            : "s"}
        </p>
      </div>

      {issues.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          None.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {issues.map(
            (issue, index) => (
              <div
                key={`${issueKey(
                  issue
                )}-${index}`}
                className="rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {issue.message}
                    </p>

                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      {issue.filePath}
                      {issue.line
                        ? ` · line ${issue.line}`
                        : ""}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {issue.rule}
                    </p>
                  </div>

                  <span className="rounded-full border px-2 py-1 text-xs capitalize">
                    {issue.severity}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}