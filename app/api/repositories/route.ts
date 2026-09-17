import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";

import {
  repositories,
  users,
  analyses,
  analyzedFiles,
  issues,
  dependencyEdges,
} from "@/db/schema";

import { parseGithubUrl } from "@/lib/github/parseGithubUrl";

import {
  getRepository,
  getRepositoryTree,
  getFileContent,
  GitHubApiError,
} from "@/lib/github/client";

import { filterSourceFiles } from "@/lib/github/filterTree";
import { parseSourceFile } from "@/lib/parser/parseSourceFile";

import { ParsedFile } from "@/types/parser";
import { DetectedIssue } from "@/types/issues";

import { buildDependencyGraph } from "@/lib/graph/buildDependencyGraph";
import { calculateGraphMetrics } from "@/lib/graph/calculateGraphMetrics";
import { rankImportantFiles } from "@/lib/graph/rankImportantFiles";

import { runRules } from "@/lib/rules/runRules";

import { calculateHealthScore } from "@/lib/analysis/calculateHealthScore";
import { calculateComplexity } from "@/lib/analysis/calculateComplexity";

import { processInBatches } from "@/lib/analysis/processInBatches";

import { analyzeRepositorySchema } from "@/lib/validation/repository";

class RepositoryAnalysisError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name =
      "RepositoryAnalysisError";

    this.status = status;
  }
}

export async function POST(request: Request) {
  // NEW:
  // Keeps track of the analysis currently being processed.
  // This allows the catch block to mark it as failed.
  let activeAnalysisId: number | null = null;

  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // 2. Read GitHub URL
  let body;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid JSON body",
      },
      {
        status: 400,
      }
    );
  }

  const validation =
    analyzeRepositorySchema.safeParse(
      body
    );

  if (!validation.success) {
    return NextResponse.json(
      {
        error:
          validation.error.issues[0]
            ?.message ??
          "Invalid request",
      },
      {
        status: 400,
      }
    );
  }

const { githubUrl } =
  validation.data;
    // 3. Parse GitHub URL
    const parsedRepo =
      parseGithubUrl(githubUrl);

    if (!parsedRepo) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub repository URL",
        },
        {
          status: 400,
        }
      );
    }

    const { owner, repo } =
      parsedRepo;

    // 4. Fetch repository metadata
    const githubRepo =
      await getRepository(
        owner,
        repo
      );

    // 5. Find logged-in user
    const [user] = await db
      .select()
      .from(users)
      .where(
        eq(
          users.email,
          session.user.email
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // 6. Find existing repository
    let [savedRepository] =
      await db
        .select()
        .from(repositories)
        .where(
          and(
            eq(
              repositories.userId,
              user.id
            ),
            eq(
              repositories.owner,
              owner
            ),
            eq(
              repositories.name,
              githubRepo.name
            )
          )
        )
        .limit(1);

    // Create repository if it doesn't exist
    if (!savedRepository) {
      [savedRepository] =
        await db
          .insert(repositories)
          .values({
            userId:
              user.id,

            githubUrl,

            owner,

            name:
              githubRepo.name,

            defaultBranch:
              githubRepo.default_branch,

            language:
              githubRepo.language,
          })
          .returning();
    } else {
      // Refresh repository metadata
      [savedRepository] =
        await db
          .update(repositories)
          .set({
            githubUrl,

            defaultBranch:
              githubRepo.default_branch,

            language:
              githubRepo.language,
          })
          .where(
            eq(
              repositories.id,
              savedRepository.id
            )
          )
          .returning();
    }

    // 7. Create NEW analysis
    const [analysis] =
      await db
        .insert(analyses)
        .values({
          repositoryId:
            savedRepository.id,

          status: "pending",
        })
        .returning();

    // NEW:
    // Remember which analysis is active.
    activeAnalysisId =
      analysis.id;

    // 8. Fetch repository tree
    const tree =
      await getRepositoryTree(
        owner,
        repo,
        githubRepo.default_branch
      );

    const sourceFiles =
      filterSourceFiles(
        tree.tree
      );

    if (sourceFiles.length === 0) {
      throw new RepositoryAnalysisError(
        "No supported JavaScript or TypeScript source files were found. RepoLens currently supports .js, .jsx, .ts and .tsx files.",
        422
      );
    }

    // Temporary development limit
    const filesToAnalyze =
      sourceFiles.slice(
        0,
        25
      );

    // 9. Mark analysis as processing
    await db
      .update(analyses)
      .set({
        status: "processing",
      })
      .where(
        eq(
          analyses.id,
          analysis.id
        )
      );

    // Data collected during analysis
    const parsedFiles:
      ParsedFile[] = [];

    const allDetectedIssues:
      DetectedIssue[] = [];

    const complexityMap =
      new Map<
        string,
        number
      >();

    let totalIssues = 0;

    // 10. Analyze files in controlled batches
    const fileResults =
      await processInBatches(
        filesToAnalyze,
        5,

        async (file) => {
          try {
            // Fetch source code
            const code =
              await getFileContent(
                owner,
                repo,
                file.path
              );

            // Calculate complexity
            const complexity =
              calculateComplexity(
                file.path,
                code
              );

            // Parse AST
            const parsed =
              parseSourceFile(
                file.path,
                code
              );

            // Run static-analysis rules
            const detectedIssues =
              runRules({
                parsedFile: parsed,
                code,
              });

            // Store analyzed file
            const [savedFile] =
              await db
                .insert(
                  analyzedFiles
                )
                .values({
                  analysisId:
                    analysis.id,

                  path:
                    parsed.path,

                  language:
                    file.path.endsWith(
                      ".ts"
                    ) ||
                    file.path.endsWith(
                      ".tsx"
                    )
                      ? "TypeScript"
                      : "JavaScript",

                  linesOfCode:
                    code.split(
                      "\n"
                    ).length,

                  complexity,

                  functionCount:
                    parsed.functions
                      .length,

                  classCount:
                    parsed.classes
                      .length,

                  interfaceCount:
                    parsed.interfaces
                      .length,

                  typeCount:
                    parsed.types
                      .length,

                  dependencyCount:
                    parsed.imports
                      .length,
                })
                .returning();

            // Store issues
            if (
              detectedIssues.length >
              0
            ) {
              await db
                .insert(issues)
                .values(
                  detectedIssues.map(
                    (issue) => ({
                      analysisId:
                        analysis.id,

                      fileId:
                        savedFile.id,

                      rule:
                        issue.rule,

                      severity:
                        issue.severity,

                      message:
                        issue.message,

                      line:
                        issue.line ??
                        null,
                    })
                  )
                );
            }

            return {
              success: true as const,

              parsed,
              complexity,
              detectedIssues,
            };
          } catch (error) {
            /*
            * Some individual files may disappear
            * between fetching the tree and fetching
            * their contents, or GitHub may not return
            * usable content for a specific file.
            *
            * These should not destroy the entire run.
            */
            if (
              error instanceof
                GitHubApiError &&
              (error.code ===
                "NO_CONTENT" ||
                error.code ===
                  "NOT_FOUND")
            ) {
              console.warn(
                `Skipping ${file.path}: ${error.message}`
              );

              return {
                success:
                  false as const,

                path:
                  file.path,

                reason:
                  error.message,
              };
            }

            /*
            * Rate limits, authentication failures,
            * GitHub outages and unexpected errors
            * are repository-level failures.
            */
            throw error;
          }
        }
      );

    // 11. Aggregate batch results

    for (
      const result
      of fileResults
    ) {
      if (!result.success) {
        continue;
      }

      parsedFiles.push(
        result.parsed
      );

      complexityMap.set(
        result.parsed.path,
        result.complexity
      );

      allDetectedIssues.push(
        ...result.detectedIssues
      );

      totalIssues +=
        result.detectedIssues.length;
    }
    if (
      parsedFiles.length === 0
    ) {
      throw new RepositoryAnalysisError(
        "RepoLens could not successfully analyze any supported source files in this repository.",
        422
      );
    }

    // 12. Build dependency graph
    const dependencyGraph =
      buildDependencyGraph(
        parsedFiles
      );

    // Store dependency edges
    const edgeRows = [];

    for (
      const sourcePath
      in dependencyGraph
    ) {
      for (
        const targetPath
        of dependencyGraph[
          sourcePath
        ].dependencies
      ) {
        edgeRows.push({
          analysisId:
            analysis.id,

          sourcePath,
          targetPath,
        });
      }
    }

    if (
      edgeRows.length > 0
    ) {
      await db
        .insert(
          dependencyEdges
        )
        .values(
          edgeRows
        );
    }

    // 13. Calculate graph metrics
    const graphMetrics =
      calculateGraphMetrics(
        dependencyGraph
      );

    // 14. Rank important files
    const importantFiles =
      rankImportantFiles(
        graphMetrics
      );

    // 15. Combine complexity + graph importance
    const fileHealthData =
      importantFiles.map(
        (file) => ({
          complexity:
            complexityMap.get(
              file.path
            ) ?? 0,

          importanceScore:
            file.importanceScore,
        })
      );

    // 16. Calculate health score
    const healthScore =
      calculateHealthScore(
        allDetectedIssues,
        fileHealthData
      );


    // 17. Store graph metrics in batches
    await processInBatches(
      importantFiles,
      5,

      async (file) => {
        await db
          .update(
            analyzedFiles
          )
          .set({
            inDegree:
              file.inDegree,

            outDegree:
              file.outDegree,

            importanceScore:
              file.importanceScore,
          })
          .where(
            and(
              eq(
                analyzedFiles.analysisId,
                analysis.id
              ),

              eq(
                analyzedFiles.path,
                file.path
              )
            )
          );

        return file.path;
      }
    );

    // 18. Mark analysis completed
    await db
      .update(analyses)
      .set({
        status:
          "completed",

        totalFiles:
          parsedFiles.length,

        totalIssues,

        healthScore,
      })
      .where(
        eq(
          analyses.id,
          analysis.id
        )
      );

    // NEW:
    // Analysis completed successfully,
    // so there is no longer an active failed candidate.
    activeAnalysisId = null;

    // 19. Return response
    return NextResponse.json(
      {
        repository:
          savedRepository,

        analysis: {
          ...analysis,

          status:
            "completed",

          totalFiles:
            parsedFiles.length,

          totalIssues,

          healthScore,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Repository analysis failed:",
      error
    );

    // NEW:
    // If an analysis had already been created,
    // mark it as failed instead of leaving it
    // stuck as pending/processing.
    if (
      activeAnalysisId !== null
    ) {
      try {
        await db
          .update(analyses)
          .set({
            status: "failed",
          })
          .where(
            eq(
              analyses.id,
              activeAnalysisId
            )
          );
      } catch (
        updateError
      ) {
        console.error(
          "Failed to mark analysis as failed:",
          updateError
        );
      }
    }

    let status = 500;

    if (
      error instanceof
        GitHubApiError
    ) {
      status = error.status;
    }

    if (
      error instanceof
        RepositoryAnalysisError
    ) {
      status = error.status;
    }

    const responseBody: {
      error: string;
      resetAt?: string;
    } = {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create and analyze repository",
    };

    if (
      error instanceof
        GitHubApiError &&
      error.code ===
        "RATE_LIMITED" &&
      error.resetAt
    ) {
      responseBody.resetAt =
        error.resetAt.toISOString();
    }

    return NextResponse.json(
      responseBody,
      {
        status,
      }
    );
  }
}