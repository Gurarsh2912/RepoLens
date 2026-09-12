import { desc, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import {
  repositories,
  analyses,
  dependencyEdges,
  analyzedFiles,
} from "@/db/schema";

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const repositoryId = Number(id);

  // 1. Get repository
  const [repository] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, repositoryId))
    .limit(1);

  if (!repository) {
    return (
      <main className="p-8">
        Repository not found
      </main>
    );
  }

  // 2. Get latest analysis
  const [analysis] = await db
    .select()
    .from(analyses)
    .where(
      eq(
        analyses.repositoryId,
        repositoryId
      )
    )
    .orderBy(desc(analyses.createdAt))
    .limit(1);

  if (!analysis) {
    return (
      <main className="p-8">
        No analysis found
      </main>
    );
  }

  // 3. Get dependency edges
  const edges = await db
    .select()
    .from(dependencyEdges)
    .where(
      eq(
        dependencyEdges.analysisId,
        analysis.id
      )
    );

  // 4. Get analyzed file metadata
  const files = await db
    .select({
      id: analyzedFiles.id,
      path: analyzedFiles.path,
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

  // 5. Create path -> file lookup
  const fileMap = new Map(
    files.map((file) => [
      file.path,
      file,
    ])
  );

  const topFile = files.reduce(
    (best, current) =>
      (current.importanceScore ?? 0) >
      (best?.importanceScore ?? -1)
        ? current
        : best,
    files[0]
  );

  const totalNodes = files.length;
  const totalEdges = edges.length;

  const groupedDependencies = new Map<string, string[]>();
  for (const edge of edges) {
    const existing = groupedDependencies.get(edge.sourcePath) ?? [];

    existing.push(edge.targetPath);

    groupedDependencies.set(
      edge.sourcePath,
      existing
    );
  }


 return (
  <main className="mx-auto max-w-7xl space-y-8 px-6 py-10">
    <div>
      <Link
        href={`/repository/${repositoryId}`}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to repository
      </Link>

      <h1 className="mt-4 text-3xl font-semibold">
        Architecture
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        {repository.owner}/{repository.name}
      </p>
    </div>

    <section className="rounded-2xl border bg-background p-6">
      <h2 className="text-xl font-semibold">
        Dependency Relationships
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        {edges.length} internal dependency edges detected.
      </p>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Files in graph
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {totalNodes}
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Dependency edges
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {totalEdges}
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Most central file
          </p>

          <p className="mt-2 truncate font-mono text-sm font-medium">
            {topFile?.path ?? "None"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Importance {topFile?.importanceScore ?? 0}
          </p>
        </div>
      </section>

      <div className="mt-6 space-y-4">
        {edges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No internal dependencies found.
          </p>
        ) : (
          Array.from(groupedDependencies.entries()).map(
            ([sourcePath, targets]) => {
              const sourceFile = fileMap.get(sourcePath);
              const isCore = (sourceFile?.importanceScore ?? 0) >= 4;

              return (
                <div
                  key={sourcePath}
                  className="rounded-xl border p-5"
                >
                  <div className="flex items-center gap-2">
                    {sourceFile ? (
                      <Link
                        href={`/repository/${repositoryId}/file/${sourceFile.id}`}
                        className={`font-mono text-sm hover:underline ${
                          isCore ? "font-semibold" : ""
                        }`}
                      >
                        {sourcePath}
                      </Link>
                    ) : (
                      <p className="font-mono text-sm">
                        {sourcePath}
                      </p>
                    )}

                    {isCore && (
                      <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        Core
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 border-l pl-4">
                    {targets.map((targetPath) => {
                      const targetFile = fileMap.get(targetPath);

                      return (
                        <div
                          key={targetPath}
                          className="flex items-center gap-3"
                        >
                          <span className="text-muted-foreground">
                            →
                          </span>


                          {targetFile ? (
                            <Link
                              href={`/repository/${repositoryId}/file/${targetFile.id}`}
                              className="font-mono text-sm hover:underline"
                            >
                              {targetPath}
                            </Link>
                          ) : (
                            <span className="font-mono text-sm">
                              {targetPath}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )
        )}
      </div>
    </section>
  </main>
)};