import Link from "next/link";

type AnalysisHistoryItem = {
  id: number;
  healthScore: number | null;
  totalFiles: number | null;
  totalIssues: number | null;
  status: string;
  createdAt: Date;
};

type Props = {
  repositoryId: number;
  analyses: AnalysisHistoryItem[];
  currentAnalysisId: number;
};

export default function AnalysisHistory({
  repositoryId,
  analyses,
  currentAnalysisId,
}: Props) {
  return (
    <section className="rounded-2xl border bg-background p-6 shadow-sm">
      {/* Small top summary */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Repository analysis runs
        </p>

        <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
          {analyses.length} run
          {analyses.length === 1 ? "" : "s"}
        </span>
      </div>

      {analyses.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">
            No analyses yet
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Analysis runs for this repository will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {analyses.map((analysis) => {
            const isCompleted =
              analysis.status === "completed";

            const isLatest =
              analysis.id === currentAnalysisId &&
              isCompleted;

            const content = (
              <div
                className={`group rounded-xl border p-4 transition-all ${
                  isCompleted
                    ? "hover:-translate-y-0.5 hover:bg-muted/30 hover:shadow-sm"
                    : "bg-muted/10"
                }`}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  {/* Analysis identity */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        Analysis #{analysis.id}
                      </p>

                      <StatusBadge
                        status={analysis.status}
                      />

                      {isLatest && (
                        <span className="rounded-full border bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
                          Latest
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(
                        analysis.createdAt
                      ).toLocaleString()}
                    </p>

                    {!isCompleted && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {getStatusMessage(
                          analysis.status
                        )}
                      </p>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="flex flex-wrap items-center gap-6">
                    <Metric
                      label="Health"
                      value={
                        analysis.healthScore
                      }
                      suffix={
                        analysis.healthScore !== null
                          ? "/100"
                          : undefined
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

                    {isCompleted && (
                      <span className="text-muted-foreground transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );

            // Failed / processing / pending analyses
            // do not have complete snapshot pages.
            if (!isCompleted) {
              return (
                <div key={analysis.id}>
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={analysis.id}
                href={`/repository/${repositoryId}/analysis/${analysis.id}`}
                className="block"
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <div className="min-w-14">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value ?? "—"}

        {value !== null && suffix && (
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusStyles(
        status
      )}`}
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
      return "border-green-500/20 bg-green-500/5 text-green-600";

    case "failed":
      return "border-red-500/20 bg-red-500/5 text-red-600";

    case "processing":
      return "border-blue-500/20 bg-blue-500/5 text-blue-600";

    case "pending":
      return "border-yellow-500/20 bg-yellow-500/5 text-yellow-600";

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