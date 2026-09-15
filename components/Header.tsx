import Link from "next/link";

import { auth } from "@/auth";

import GithubLoginButton from "@/components/GithubLoginButton";
import GithubLogoutButton from "@/components/GithubLogoutButton";

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/dashboard"
          className="text-xl font-semibold tracking-tight"
        >
          RepoLens
        </Link>

        <nav className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>

              <div className="hidden items-center gap-2 sm:flex">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="h-8 w-8 rounded-full border"
                  />
                )}

                <span className="text-sm">
                  {session.user.name ??
                    session.user.email}
                </span>
              </div>

              <GithubLogoutButton />
            </>
          ) : (
            <GithubLoginButton />
          )}
        </nav>
      </div>
    </header>
  );
}