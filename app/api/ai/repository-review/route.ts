import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { reviewRepository } from "@/lib/ai/reviewRepository";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const repositoryId = Number(
      body.repositoryId
    );

    if (
      !repositoryId ||
      Number.isNaN(repositoryId)
    ) {
      return NextResponse.json(
        {
          error:
            "Valid repositoryId is required",
        },
        { status: 400 }
      );
    }

    const result =
      await reviewRepository(
        repositoryId
      );

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
        "Repository AI review failed:",
        error
    );

    return NextResponse.json(
        {
        error:
            error instanceof Error
            ? error.message
            : "Failed to generate repository review",
        },
        { status: 500 }
    );
    }
}