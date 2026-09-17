import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";

import {
  analyzedFiles,
  analyses,
  repositories,
  issues,
  users,
} from "@/db/schema";

import { reviewFile } from "@/lib/ai/reviewFile";
import { fileReviewSchema } from "@/lib/validation/ai";

import { AIServiceError } from "@/lib/ai/error";

export async function POST(
  request: Request
) {
  try {
    // 1. Authenticate user
    const session =
      await auth();

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

    // 2. Safely read request body
    let body;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON body",
        },
        {
          status: 400,
        }
      );
    }

    const validation =
      fileReviewSchema.safeParse(
        body
      );

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid file ID",
        },
        {
          status: 400,
        }
      );
    }

    const { fileId } =
      validation.data;

    // 4. Find logged-in DB user
    const [user] =
      await db
        .select({
          id: users.id,
        })
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

    // 5. Fetch file AND verify ownership
    const [file] =
      await db
        .select({
          id:
            analyzedFiles.id,

          path:
            analyzedFiles.path,

          language:
            analyzedFiles.language,

          linesOfCode:
            analyzedFiles.linesOfCode,

          complexity:
            analyzedFiles.complexity,

          functionCount:
            analyzedFiles.functionCount,

          classCount:
            analyzedFiles.classCount,

          outDegree:
            analyzedFiles.outDegree,

          inDegree:
            analyzedFiles.inDegree,

          importanceScore:
            analyzedFiles.importanceScore,
        })
        .from(analyzedFiles)

        .innerJoin(
          analyses,
          eq(
            analyzedFiles.analysisId,
            analyses.id
          )
        )

        .innerJoin(
          repositories,
          eq(
            analyses.repositoryId,
            repositories.id
          )
        )

        .where(
          and(
            eq(
              analyzedFiles.id,
              fileId
            ),

            eq(
              repositories.userId,
              user.id
            )
          )
        )

        .limit(1);

    if (!file) {
      return NextResponse.json(
        {
          error: "File not found",
        },
        {
          status: 404,
        }
      );
    }

    // 6. Fetch issues for this file
    const fileIssues =
      await db
        .select({
          rule: issues.rule,
          severity:
            issues.severity,
          message:
            issues.message,
          line:
            issues.line,
        })
        .from(issues)
        .where(
          eq(
            issues.fileId,
            file.id
          )
        );

    // 7. Generate AI review
    const review =
      await reviewFile({
        path:
          file.path,

        language:
          file.language,

        linesOfCode:
          file.linesOfCode ?? 0,

        complexity:
          file.complexity ?? 0,

        functionCount:
          file.functionCount ?? 0,

        classCount:
          file.classCount ?? 0,

        dependencies:
          file.outDegree ?? 0,

        dependents:
          file.inDegree ?? 0,

        importanceScore:
          file.importanceScore ?? 0,

        issues:
          fileIssues,
      });

    return NextResponse.json({
      review,
    });
  } catch (error) {
    console.error(
      "File AI review failed:",
      error
    );

    if (
      error instanceof
        AIServiceError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status:
            error.status,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to generate file review",
      },
      {
        status: 500,
      }
    );
  }
}