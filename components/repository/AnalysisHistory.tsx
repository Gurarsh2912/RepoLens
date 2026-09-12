import Link from "next/link";

type AnalysisHistoryItem = {
  id: number;

  healthScore:
    | number
    | null;

  totalFiles:
    | number
    | null;

  totalIssues:
    | number
    | null;

  status: string;

  createdAt: Date;
};

type Props = {
  repositoryId: number;

  analyses:
    AnalysisHistoryItem[];

  currentAnalysisId:
    number;
};

export default function AnalysisHistory({
  repositoryId,
  analyses,
  currentAnalysisId,
}: Props) {
  return (
    <section className="rounded-2xl border bg-background p-6">
      <div>
        <h2 className="text-xl font-semibold">
          Analysis History
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Previous analysis runs for
          this repository.
        </p>
      </div>

      {analyses.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          No analyses yet.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {analyses.map(
            (analysis) => {
              const isCompleted =
                analysis.status ===
                "completed";

              const isLatest =
                analysis.id ===
                  currentAnalysisId &&
                isCompleted;

              const content = (
                <div className="rounded-xl border p-4 transition-colors hover:bg-muted/40">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          Analysis #
                          {
                            analysis.id
                          }
                        </p>

                        <StatusBadge
                          status={
                            analysis.status
                          }
                        />

                        {isLatest && (
                          <span className="rounded-full border px-2 py-0.5 text-xs font-medium">
                            Latest
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(
                          analysis.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-5 text-sm">
                      <Metric
                        label="Health"
                        value={
                          analysis.healthScore
                        }
                      />

                      <Metric
                        label="Files"
                        value={
                          analysis.totalFiles
                        }
                      />

                      <Metric
                        label="Issues"
                        value={
                          analysis.totalIssues
                        }
                      />
                    </div>
                  </div>

                  {!isCompleted && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {getStatusMessage(
                        analysis.status
                      )}
                    </p>
                  )}
                </div>
              );

              // Only completed analyses
              // have a usable snapshot page.
              if (!isCompleted) {
                return (
                  <div
                    key={
                      analysis.id
                    }
                  >
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  key={
                    analysis.id
                  }
                  href={`/repository/${repositoryId}/analysis/${analysis.id}`}
                  className="block"
                >
                  {content}
                </Link>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;

  value:
    | number
    | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="font-medium">
        {value ?? "—"}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles =
    getStatusStyles(
      status
    );

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
}

function getStatusStyles(
  status: string
) {
  switch (status) {
    case "completed":
      return "border-green-500/30 bg-green-500/10 text-green-600";

    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-600";

    case "processing":
      return "border-blue-500/30 bg-blue-500/10 text-blue-600";

    case "pending":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-600";

    default:
      return "text-muted-foreground";
  }
}

function getStatusMessage(
  status: string
) {
  switch (status) {
    case "failed":
      return "This analysis failed before completion.";

    case "processing":
      return "Repository analysis is currently running.";

    case "pending":
      return "This analysis is waiting to start.";

    default:
      return "";
  }
}