import Link from "next/link";
import { redirect } from "next/navigation";

import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";

import {
  users,
  repositories,
  analyses,
} from "@/db/schema";

import RepositoryForm from "@/components/RepositoryForm";

export default async function DashboardPage() {
  // 1. Make sure user is logged in
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  // 2. Find current database user
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
    redirect("/");
  }

  // 3. Get repositories owned by this user
  const userRepositories =
    await db
      .select()
      .from(repositories)
      .where(
        eq(
          repositories.userId,
          user.id
        )
      )
      .orderBy(
        desc(
          repositories.id
        )
      );

  // 4. Get latest completed analysis
  // for each repository
  const repositoryData =
    await Promise.all(
      userRepositories.map(
        async (repository) => {
          const [latestAnalysis] =
            await db
              .select()
              .from(analyses)
              .where(
                and(
                  eq(
                    analyses.repositoryId,
                    repository.id
                  ),
                  eq(
                    analyses.status,
                    "completed"
                  )
                )
              )
              .orderBy(
                desc(
                  analyses.createdAt
                )
              )
              .limit(1);

          return {
            repository,
            latestAnalysis:
              latestAnalysis ?? null,
          };
        }
      )
    );

  // 5. Dashboard statistics
  const repositoryCount =
    repositoryData.length;

  const analyzedRepositories =
    repositoryData.filter(
      (item) =>
        item.latestAnalysis !== null
    );

  const totalIssues =
    analyzedRepositories.reduce(
      (total, item) =>
        total +
        (item.latestAnalysis
          ?.totalIssues ?? 0),
      0
    );

  const averageHealth =
    analyzedRepositories.length > 0
      ? Math.round(
          analyzedRepositories.reduce(
            (total, item) =>
              total +
              (item.latestAnalysis
                ?.healthScore ?? 0),
            0
          ) /
            analyzedRepositories.length
        )
      : 0;

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Hero */}
        <section className="max-w-3xl">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Codebase Intelligence
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Understand your codebase
            before it becomes technical
            debt.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Analyze architecture,
            dependencies, complexity and
            static-analysis findings from
            any GitHub repository.
          </p>
        </section>

        {/* Analyzer */}
        <section className="mt-10 rounded-2xl border bg-background p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Analyze a repository
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Paste a public GitHub
              repository URL to generate a
              RepoLens analysis.
            </p>
          </div>

          <RepositoryForm />
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Repositories"
            value={repositoryCount}
          />

          <StatCard
            label="Issues Detected"
            value={totalIssues}
          />

          <StatCard
            label="Average Health"
            value={
              analyzedRepositories.length >
              0
                ? `${averageHealth}/100`
                : "—"
            }
          />
        </section>

        {/* Recent repositories */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Recent repositories
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Continue exploring your
                previously analyzed
                codebases.
              </p>
            </div>
          </div>

          {repositoryData.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed bg-background p-10 text-center">
              <h3 className="font-medium">
                No repositories yet
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Analyze your first GitHub
                repository above and it
                will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {repositoryData.map(
                ({
                  repository,
                  latestAnalysis,
                }) => (
                  <Link
                    key={repository.id}
                    href={`/repository/${repository.id}`}
                    className="group block rounded-2xl border bg-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="truncate text-lg font-semibold">
                            {
                              repository.name
                            }
                          </h3>

                          {repository.language && (
                            <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                              {
                                repository.language
                              }
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {
                            repository.owner
                          }
                          /
                          {
                            repository.name
                          }
                        </p>
                      </div>

                      {latestAnalysis ? (
                        <div className="flex flex-wrap items-center gap-8">
                          <RepositoryMetric
                            label="Health"
                            value={
                              latestAnalysis.healthScore ??
                              "—"
                            }
                          />

                          <RepositoryMetric
                            label="Files"
                            value={
                              latestAnalysis.totalFiles ??
                              0
                            }
                          />

                          <RepositoryMetric
                            label="Issues"
                            value={
                              latestAnalysis.totalIssues ??
                              0
                            }
                          />

                          <span className="text-lg text-muted-foreground transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          No completed
                          analysis
                          <span>→</span>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border bg-background p-5">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function RepositoryMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value}
      </p>
    </div>
  );
}