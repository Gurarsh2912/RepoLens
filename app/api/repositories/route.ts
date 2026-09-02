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
} from "@/db/schema";

import { parseGithubUrl } from "@/lib/github/parseGithubUrl";
import {
  getRepository,
  getRepositoryTree,
  getFileContent,
} from "@/lib/github/client";

import { filterSourceFiles } from "@/lib/github/filterTree";
import { parseSourceFile } from "@/lib/parser/parseSourceFile";

import { ParsedFile } from "@/types/parser";

import { buildDependencyGraph } from "@/lib/graph/buildDependencyGraph";
import { calculateGraphMetrics } from "@/lib/graph/calculateGraphMetrics";
import { rankImportantFiles } from "@/lib/graph/rankImportantFiles";

import { runRules } from "@/lib/rules/runRules";

import { DetectedIssue } from "@/types/issues";
import { calculateHealthScore } from "@/lib/analyses/calculateHealthScore";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Read GitHub URL
    const body = await request.json();
    const githubUrl = body.githubUrl;

    if (!githubUrl) {
      return NextResponse.json(
        { error: "GitHub URL is required" },
        { status: 400 }
      );
    }

    // 3. Parse URL
    const parsedRepo = parseGithubUrl(githubUrl);

    if (!parsedRepo) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL" },
        { status: 400 }
      );
    }

    const { owner, repo } = parsedRepo;

    // 4. Fetch GitHub repository metadata
    const githubRepo = await getRepository(owner, repo);

    // 5. Find logged-in user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 6. Save repository
    const [savedRepository] = await db
      .insert(repositories)
      .values({
        userId: user.id,
        githubUrl,
        owner,
        name: githubRepo.name,
        defaultBranch: githubRepo.default_branch,
        language: githubRepo.language,
      })
      .returning();

    // 7. Create analysis
    const [analysis] = await db
      .insert(analyses)
      .values({
        repositoryId: savedRepository.id,
        status: "pending",
      })
      .returning();

    // 8. Fetch repository tree
    const tree = await getRepositoryTree(
      owner,
      repo,
      githubRepo.default_branch
    );

    const sourceFiles = filterSourceFiles(tree.tree);

    // Temporary limit while developing
    const filesToAnalyze = sourceFiles.slice(0, 25);

    // 9. Mark analysis as processing
    await db
      .update(analyses)
      .set({
        status: "processing",
      })
      .where(eq(analyses.id, analysis.id));

    const parsedFiles: ParsedFile[] = [];

    let totalIssues = 0;
    const allDetectedIssues: DetectedIssue[] = [];

    // 10. Analyze files
    for (const file of filesToAnalyze) {
      const code = await getFileContent(
        owner,
        repo,
        file.path
      );

      const parsed = parseSourceFile(
        file.path,
        code
      );

      parsedFiles.push(parsed);

      // 11. Run static-analysis rules
      const detectedIssues = runRules({
        parsedFile: parsed,
        code,
      });
      allDetectedIssues.push(...detectedIssues);

      totalIssues += detectedIssues.length;

      // 12. Store analyzed file
      const [savedFile] = await db
        .insert(analyzedFiles)
        .values({
          analysisId: analysis.id,
          path: parsed.path,

          language:
            file.path.endsWith(".ts") ||
            file.path.endsWith(".tsx")
              ? "TypeScript"
              : "JavaScript",

          linesOfCode: code.split("\n").length,

          functionCount: parsed.functions.length,
          classCount: parsed.classes.length,
          interfaceCount: parsed.interfaces.length,
          typeCount: parsed.types.length,

          dependencyCount: parsed.imports.length,
        })
        .returning();

      // 13. Store detected issues
      if (detectedIssues.length > 0) {
        await db.insert(issues).values(
          detectedIssues.map((issue) => ({
            analysisId: analysis.id,
            fileId: savedFile.id,
            rule: issue.rule,
            severity: issue.severity,
            message: issue.message,
            line: issue.line ?? null,
          }))
        );
      }
    }

    const healthScore =
    calculateHealthScore(allDetectedIssues);

    // 14. Build dependency graph
    const dependencyGraph =
      buildDependencyGraph(parsedFiles);

    // 15. Calculate graph metrics
    const graphMetrics =
      calculateGraphMetrics(dependencyGraph);

    // 16. Rank important files
    const importantFiles =
      rankImportantFiles(graphMetrics);

    console.log(
      "Analyzed files:",
      parsedFiles.length
    );

    console.log(
      "Top important files:",
      importantFiles.slice(0, 5)
    );

    // 17. Store graph metrics
    for (const file of importantFiles) {
      await db
        .update(analyzedFiles)
        .set({
          inDegree: file.inDegree,
          outDegree: file.outDegree,
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
    }

    // 18. Mark analysis completed
    await db
      .update(analyses)
      .set({
        status: "completed",
        totalFiles: filesToAnalyze.length,
        totalIssues,
        healthScore,
      })
      .where(eq(analyses.id, analysis.id));

    // 19. Return response
    return NextResponse.json(
      {
        repository: savedRepository,

        analysis: {
          ...analysis,
          status: "completed",
          totalFiles: filesToAnalyze.length,
          totalIssues,
          healthScore,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Repository analysis failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create and analyze repository",
      },
      { status: 500 }
    );
  }
}