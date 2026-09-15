import Link from "next/link";

type IssueData = {
  id: number;
  rule: string;
  severity: string;
  message: string;
  line: number | null;
  fileId: number;
  filePath: string;
};

type Props = {
  repositoryId: number;
  issues: IssueData[];
};

export default function IssueList({
  repositoryId,
  issues,
}: Props) {
  return (
    <section className="rounded-2xl border bg-background p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Detected issues
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Static-analysis findings from the latest analysis.
          </p>
        </div>

        <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
          {issues.length} total
        </span>
      </div>

      {issues.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
          <p className="font-medium">
            No issues detected
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            RepoLens did not find any static-analysis issues in this run.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/repository/${repositoryId}/file/${issue.fileId}`}
              className="group block rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:bg-muted/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge
                      severity={issue.severity}
                    />

                    <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                      {issue.rule}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium leading-6">
                    {issue.message}
                  </p>

                  <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                    {issue.filePath}
                    {issue.line
                      ? `:${issue.line}`
                      : ""}
                  </p>
                </div>

                <span className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1">
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

function SeverityBadge({
  severity,
}: {
  severity: string;
}) {
  const styles =
    severity === "error"
      ? "border-red-500/20 bg-red-500/5 text-red-600"
      : severity === "warning"
        ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-600"
        : "border-blue-500/20 bg-blue-500/5 text-blue-600";

  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {severity}
    </span>
  );
}