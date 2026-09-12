import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";

import {
  analyzedFiles,
  issues,
} from "@/db/schema";

import { reviewFile } from "@/lib/ai/reviewFile";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json(
        {
          error: "Request body is required",
        },
        { status: 400 }
      );
    }

    let body;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    const fileId = Number(body.fileId);

    if (!fileId || Number.isNaN(fileId)) {
      return NextResponse.json(
        {
          error: "Valid fileId is required",
        },
        { status: 400 }
      );
    }

    // 1. Fetch analyzed file
    const [file] = await db
      .select()
      .from(analyzedFiles)
      .where(eq(analyzedFiles.id, fileId))
      .limit(1);

    if (!file) {
      return NextResponse.json(
        {
          error: "Analyzed file not found",
        },
        { status: 404 }
      );
    }

    // 2. Fetch static-analysis issues
    const fileIssues = await db
      .select()
      .from(issues)
      .where(eq(issues.fileId, fileId));

    // 3. Build the input expected by reviewFile()
    const review = await reviewFile({
      path: file.path,

      language: file.language,

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

      issues: fileIssues.map(
        (issue) => ({
          rule: issue.rule,
          severity: issue.severity,
          message: issue.message,
          line: issue.line,
        })
      ),
    });

    return NextResponse.json({
      review,
    });
  } catch (error) {
    console.error(
      "File AI review failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate file review",
      },
      { status: 500 }
    );
  }
}