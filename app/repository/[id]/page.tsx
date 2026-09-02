import { eq, desc } from "drizzle-orm";

import { db } from "@/db";
import { repositories, analyses, analyzedFiles, issues } from "@/db/schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import RepositoryOverview from "@/components/repository/RepositoryOverview";
import ImportantFiles from "@/components/repository/ImportantFiles";
import IssueList from "@/components/repository/IssueList";

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const repositoryId = Number(id);

  // 1. Get repository
  const [repository] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, repositoryId))
    .limit(1);

  if (!repository) {
    return <main className="p-8">Repository not found</main>;
  }

  // 2. Get latest analysis
  const [analysis] = await db
    .select()
    .from(analyses)
    .where(eq(analyses.repositoryId, repositoryId))
    .orderBy(desc(analyses.createdAt))
    .limit(1);

  if (!analysis) {
    return <main className="p-8">No analysis found</main>;
  }

  // 3. Get analyzed files
  const files = await db
    .select()
    .from(analyzedFiles)
    .where(eq(analyzedFiles.analysisId, analysis.id))
    .orderBy(desc(analyzedFiles.importanceScore));

  // 4. Get detected issues
const detectedIssues = await db
  .select({
    id: issues.id,
    rule: issues.rule,
    severity: issues.severity,
    message: issues.message,
    line: issues.line,
    filePath: analyzedFiles.path,
  })
  .from(issues)
  .innerJoin(
    analyzedFiles,
    eq(issues.fileId, analyzedFiles.id)
  )
  .where(
    eq(
      issues.analysisId,
      analysis.id
    )
  );

  const severityCounts = {
    error: detectedIssues.filter(
      (issue) => issue.severity === "error"
    ).length,

    warning: detectedIssues.filter(
      (issue) => issue.severity === "warning"
    ).length,

    info: detectedIssues.filter(
      (issue) => issue.severity === "info"
    ).length,
  };

  return (
  <main className="min-h-screen bg-muted/30">
    <div className="mx-auto max-w-7xl px-6 py-10">
      <RepositoryOverview
        name={repository.name}
        owner={repository.owner}
        language={repository.language}
        healthScore={analysis.healthScore}
        totalFiles={analysis.totalFiles}
        totalIssues={analysis.totalIssues}
        severityCounts={severityCounts }
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ImportantFiles files={files} />
        <IssueList issues={detectedIssues} />
      </div>
    </div>
  </main>
);
}
