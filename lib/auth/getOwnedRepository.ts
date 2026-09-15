import { auth } from "@/auth";
import { db } from "@/db";

import {
  repositories,
  users,
} from "@/db/schema";

import {
  and,
  eq,
} from "drizzle-orm";

export async function getOwnedRepository(
  repositoryId: number
) {
  // 1. Check authentication
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  // 2. Find the logged-in user
  const [user] = await db
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
    return null;
  }

  // 3. Find repository AND verify ownership
  const [repository] = await db
    .select()
    .from(repositories)
    .where(
      and(
        eq(
          repositories.id,
          repositoryId
        ),
        eq(
          repositories.userId,
          user.id
        )
      )
    )
    .limit(1);

  return repository ?? null;
}