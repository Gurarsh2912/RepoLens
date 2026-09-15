import Link from "next/link";

type FileData = {
  id: number;
  path: string;
  inDegree: number | null;
  outDegree: number | null;
  importanceScore: number | null;
};

type Props = {
  repositoryId: number;
  files: FileData[];
};

export default function ImportantFiles({
  repositoryId,
  files,
}: Props) {
  const topFiles = files.slice(0, 5);

  return (
    <section className="rounded-2xl border bg-background p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Important files
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Files with the strongest influence in the dependency graph.
          </p>
        </div>

        <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
          Top {topFiles.length}
        </span>
      </div>

      {topFiles.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No important files detected.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {topFiles.map((file, index) => (
            <Link
              key={file.id}
              href={`/repository/${repositoryId}/file/${file.id}`}
              className="group block rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:bg-muted/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-4">
                  {/* Rank */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                    {index + 1}
                  </div>

                  {/* File info */}
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium">
                      {file.path}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <MetricBadge
                        label="Dependents"
                        value={file.inDegree ?? 0}
                      />

                      <MetricBadge
                        label="Dependencies"
                        value={file.outDegree ?? 0}
                      />

                      <MetricBadge
                        label="Importance"
                        value={file.importanceScore ?? 0}
                      />
                    </div>
                  </div>
                </div>

                <span className="mt-1 text-muted-foreground transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
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