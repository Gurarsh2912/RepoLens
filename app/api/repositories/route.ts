import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { repositories, users, analyses } from "@/db/schema";

import { parseGithubUrl } from "@/lib/github/parseGithubUrl";
import { getRepository } from "@/lib/github/client";

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
    const githubUrl = body.githubUrl;

    if (!githubUrl) {
      return NextResponse.json(
        { error: "GitHub URL is required" },
        { status: 400 }
      );
    }

    const parsedRepo = parseGithubUrl(githubUrl);

    if (!parsedRepo) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL" },
        { status: 400 }
      );
    }

    const { owner, repo } = parsedRepo;

    const githubRepo = await getRepository(owner, repo);

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

    const [analysis] = await db
      .insert(analyses)
      .values({
        repositoryId: savedRepository.id,
        status: "pending",
      })
      .returning();

    return NextResponse.json(
      {
        repository: savedRepository,
        analysis,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create repository" },
      { status: 500 }
    );
  }
}