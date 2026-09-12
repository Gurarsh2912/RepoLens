import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";

import {
  repositories,
  analyses,
  analyzedFiles,
  issues,
  dependencyEdges,
} from "@/db/schema";

import { RepositoryReviewContext } from "@/lib/ai/types";
import { getFileContent } from "@/lib/github/client";
import { buildSourceSnippet } from "@/lib/ai/buildSourceSnippet";

export async function buildRepositoryContext(
  repositoryId: number
): Promise<RepositoryReviewContext> {
  // 1. Get repository
  const [repository] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, repositoryId))
    .limit(1);

  if (!repository) {
    throw new Error("Repository not found");
  }

  // 2. Get latest completed analysis
  const [analysis] = await db
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
      desc(analyses.createdAt)
    )
    .limit(1);

  if (!analysis) {
    throw new Error(
      "No analysis found for repository"
    );
  }

  // 3. Get important files
  const importantFiles = await db
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
    )
    .limit(8);

  // 4. Get repository issues
  const repositoryIssues = await db
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
        analysis.id
      )
    )
    .limit(15);

  // 5. Count issues per file
  const issueCountByFile =
    new Map<string, number>();

  for (const issue of repositoryIssues) {
    if (!issue.filePath) {
      continue;
    }

    issueCountByFile.set(
      issue.filePath,
      (issueCountByFile.get(
        issue.filePath
      ) ?? 0) + 1
    );
  }

  // 6. Re-rank files specifically for source selection
  const rankedFilesForSource =
    [...importantFiles].sort(
      (a, b) => {
        const scoreA =
          (a.importanceScore ?? 0) * 2 +
          (a.complexity ?? 0) +
          (issueCountByFile.get(
            a.path
          ) ?? 0) * 3;

        const scoreB =
          (b.importanceScore ?? 0) * 2 +
          (b.complexity ?? 0) +
          (issueCountByFile.get(
            b.path
          ) ?? 0) * 3;

        return scoreB - scoreA;
      }
    );

  // 7. Fetch source snippets for top 3 ranked files
  const importantFilesWithSource =
    await Promise.all(
      rankedFilesForSource.map(
        async (file, index) => {
          // Only include code for top 3 files
          if (index >= 3) {
            return {
              ...file,
              sourceSnippet:
                undefined,
            };
          }

          // Find issue lines belonging to this file
          const importantLines =
            repositoryIssues
              .filter(
                (issue) =>
                  issue.filePath ===
                  file.path
              )
              .map(
                (issue) =>
                  issue.line
              )
              .filter(
                (
                  line
                ): line is number =>
                  line !== null
              );

          try {
            const code =
              await getFileContent(
                repository.owner,
                repository.name,
                file.path
              );

            return {
              ...file,

              sourceSnippet:
                buildSourceSnippet(
                  code,
                  {
                    importantLines,
                  }
                ),
            };
          } catch (error) {
            console.error(
              `Failed to fetch source for ${file.path}:`,
              error
            );

            return {
              ...file,
              sourceSnippet:
                undefined,
            };
          }
        }
      )
    );

  // 8. Get dependency relationships
  const edges = await db
    .select()
    .from(dependencyEdges)
    .where(
      eq(
        dependencyEdges.analysisId,
        analysis.id
      )
    )
    .limit(25);

  // 9. Build clean AI context
  return {
    repository: {
      name: repository.name,
      owner: repository.owner,
      language:
        repository.language,
      defaultBranch:
        repository.defaultBranch,
    },

    analysis: {
      healthScore:
        analysis.healthScore ?? 0,

      totalFiles:
        analysis.totalFiles ?? 0,

      totalIssues:
        analysis.totalIssues ?? 0,
    },

    importantFiles:
      importantFilesWithSource.map(
        (file) => ({
          path: file.path,

          complexity:
            file.complexity ?? 0,

          importanceScore:
            file.importanceScore ?? 0,

          inDegree:
            file.inDegree ?? 0,

          outDegree:
            file.outDegree ?? 0,

          linesOfCode:
            file.linesOfCode ?? 0,

          functionCount:
            file.functionCount ?? 0,

          sourceSnippet:
            file.sourceSnippet,
        })
      ),

    issues:
      repositoryIssues.map(
        (issue) => ({
          rule: issue.rule,

          severity:
            issue.severity,

          message:
            issue.message,

          line:
            issue.line,
        })
      ),

    dependencies:
      edges.map((edge) => ({
        source:
          edge.sourcePath,

        target:
          edge.targetPath,
      })),
  };
}