import { auth } from "@/auth";
import { redirect } from "next/navigation";

import GithubLoginButton from "@/components/GithubLoginButton";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-semibold">
          RepoLens
        </h1>

        <p className="mt-3 text-muted-foreground">
          Understand your codebase before technical debt grows.
        </p>

        <div className="mt-6">
          <GithubLoginButton />
        </div>
      </div>
    </main>
  );
}