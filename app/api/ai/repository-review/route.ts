import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { reviewRepository } from "@/lib/ai/reviewRepository";
import { getOwnedRepository } from "@/lib/auth/getOwnedRepository";

import { repositoryReviewSchema } from "@/lib/validation/ai";

import { AIServiceError } from "@/lib/ai/error";

export async function POST(
  request: Request
) {
  try {
    // 1. Authentication
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
    repositoryReviewSchema.safeParse(
      body
    );

  if (!validation.success) {
    return NextResponse.json(
      {
        error:
          "Invalid repository ID",
      },
      {
        status: 400,
      }
    );
  }

  const { repositoryId } =
    validation.data;

    // 4. Authorization
    const repository =
      await getOwnedRepository(
        repositoryId
      );

    if (!repository) {
      return NextResponse.json(
        {
          error:
            "Repository not found",
        },
        {
          status: 404,
        }
      );
    }

    // 5. Generate AI review
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
          "Failed to generate repository review",
      },
      {
        status: 500,
      }
    );
  }
}