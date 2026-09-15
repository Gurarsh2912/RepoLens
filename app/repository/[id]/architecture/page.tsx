import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import Link from "next/link";

import { db } from "@/db";

import {
  analyses,
  dependencyEdges,
  analyzedFiles,
} from "@/db/schema";

import { getOwnedRepository } from "@/lib/auth/getOwnedRepository";

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const repositoryId =
    Number(id);

  // 1. Verify repository ownership
  const repository =
    await getOwnedRepository(
      repositoryId
    );

  if (!repository) {
    return (
      <ErrorState
        title="Repository not found"
        description="This repository does not exist or you do not have access to it."
        href="/dashboard"
        linkText="← Back to dashboard"
      />
    );
  }

  // 2. Get latest COMPLETED analysis
  const [analysis] =
    await db
      .select()
      .from(analyses)
      .where(
        and(
          eq(
            analyses.repositoryId,
            repositoryId
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

  if (!analysis) {
    return (
      <ErrorState
        title="No completed analysis"
        description="RepoLens has not completed an analysis for this repository yet."
        href={`/repository/${repositoryId}`}
        linkText="← Back to repository"
      />
    );
  }

  // 3. Get dependency edges
  const edges =
    await db
      .select()
      .from(dependencyEdges)
      .where(
        eq(
          dependencyEdges.analysisId,
          analysis.id
        )
      );

  // 4. Get analyzed files
  const files =
    await db
      .select({
        id:
          analyzedFiles.id,

        path:
          analyzedFiles.path,

        importanceScore:
          analyzedFiles.importanceScore,

        inDegree:
          analyzedFiles.inDegree,

        outDegree:
          analyzedFiles.outDegree,
      })
      .from(analyzedFiles)
      .where(
        eq(
          analyzedFiles.analysisId,
          analysis.id
        )
      );

  // 5. Path -> file lookup
  const fileMap =
    new Map(
      files.map(
        (file) => [
          file.path,
          file,
        ]
      )
    );

  // 6. Most important file
  const topFile =
    files.length > 0
      ? files.reduce(
          (best, current) =>
            (current.importanceScore ??
              0) >
            (best.importanceScore ??
              0)
              ? current
              : best
        )
      : null;

  const totalNodes =
    files.length;

  const totalEdges =
    edges.length;

  // 7. Group dependencies by source file
  const groupedDependencies =
    new Map<
      string,
      string[]
    >();

  for (const edge of edges) {
    const existing =
      groupedDependencies.get(
        edge.sourcePath
      ) ?? [];

    existing.push(
      edge.targetPath
    );

    groupedDependencies.set(
      edge.sourcePath,
      existing
    );
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href={`/repository/${repositoryId}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to repository
          </Link>
        </div>

        {/* Header */}
        <section className="mb-10">
          <p className="text-sm font-medium text-muted-foreground">
            Architecture analysis
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Dependency architecture
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Explore internal file
            relationships, central
            modules and dependency
            direction across the latest
            completed RepoLens analysis.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <InfoBadge>
              {repository.owner}/
              {repository.name}
            </InfoBadge>

            <InfoBadge>
              Analysis #
              {analysis.id}
            </InfoBadge>

            <InfoBadge>
              {new Date(
                analysis.createdAt
              ).toLocaleString()}
            </InfoBadge>
          </div>
        </section>

        {/* Architecture summary */}
        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Graph overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Summary of the internal
              dependency graph generated
              from parsed imports.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Files in graph"
              value={
                totalNodes
              }
            />

            <MetricCard
              label="Dependency edges"
              value={
                totalEdges
              }
            />

            <div className="rounded-2xl border bg-background p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Most central file
              </p>

              <p className="mt-3 truncate font-mono text-sm font-semibold">
                {topFile?.path ??
                  "None"}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Importance score{" "}
                <span className="font-medium text-foreground">
                  {topFile?.importanceScore ??
                    0}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Dependency relationships */}
        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Dependency relationships
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Each card shows a source
                file and the internal
                files it imports.
              </p>
            </div>

            <span className="text-sm text-muted-foreground">
              {totalEdges} edge
              {totalEdges === 1
                ? ""
                : "s"}
            </span>
          </div>

          <div className="rounded-2xl border bg-background p-6 shadow-sm">
            {edges.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="font-medium">
                  No internal dependencies
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  RepoLens did not detect
                  any internal file
                  dependency edges in
                  this analysis.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(
                  groupedDependencies.entries()
                ).map(
                  ([
                    sourcePath,
                    targets,
                  ]) => {
                    const sourceFile =
                      fileMap.get(
                        sourcePath
                      );

                    const isCore =
                      (sourceFile
                        ?.importanceScore ??
                        0) >= 4;

                    return (
                      <div
                        key={
                          sourcePath
                        }
                        className="rounded-xl border p-5"
                      >
                        {/* Source */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                              S
                            </div>

                            <div className="min-w-0">
                              {sourceFile ? (
                                <Link
                                  href={`/repository/${repositoryId}/file/${sourceFile.id}`}
                                  className="block truncate font-mono text-sm font-medium hover:underline"
                                >
                                  {
                                    sourcePath
                                  }
                                </Link>
                              ) : (
                                <p className="truncate font-mono text-sm font-medium">
                                  {
                                    sourcePath
                                  }
                                </p>
                              )}

                              <p className="mt-1 text-xs text-muted-foreground">
                                {
                                  targets.length
                                }{" "}
                                internal dependenc
                                {targets.length ===
                                1
                                  ? "y"
                                  : "ies"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {sourceFile && (
                              <>
                                <MetricBadge
                                  label="Dependents"
                                  value={
                                    sourceFile.inDegree ??
                                    0
                                  }
                                />

                                <MetricBadge
                                  label="Dependencies"
                                  value={
                                    sourceFile.outDegree ??
                                    0
                                  }
                                />
                              </>
                            )}

                            {isCore && (
                              <span className="rounded-full border bg-foreground px-2.5 py-1 text-xs font-medium text-background">
                                Core
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Targets */}
                        <div className="mt-5 space-y-2 border-l pl-5">
                          {targets.map(
                            (
                              targetPath
                            ) => {
                              const targetFile =
                                fileMap.get(
                                  targetPath
                                );

                              return (
                                <div
                                  key={
                                    targetPath
                                  }
                                  className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/30"
                                >
                                  <span className="text-muted-foreground">
                                    →
                                  </span>

                                  {targetFile ? (
                                    <Link
                                      href={`/repository/${repositoryId}/file/${targetFile.id}`}
                                      className="min-w-0 truncate font-mono text-sm hover:underline"
                                    >
                                      {
                                        targetPath
                                      }
                                    </Link>
                                  ) : (
                                    <span className="min-w-0 truncate font-mono text-sm">
                                      {
                                        targetPath
                                      }
                                    </span>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function MetricBadge({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
      {label}:{" "}
      <span className="font-medium text-foreground">
        {value}
      </span>
    </span>
  );
}

function InfoBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function ErrorState({
  title,
  description,
  href,
  linkText,
}: {
  title: string;
  description: string;
  href: string;
  linkText: string;
}) {
  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl border bg-background p-10 text-center">
          <h1 className="text-xl font-semibold">
            {title}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>

          <Link
            href={href}
            className="mt-6 inline-flex rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {linkText}
          </Link>
        </div>
      </div>
    </main>
  );
}