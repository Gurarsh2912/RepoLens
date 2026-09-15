import {
  Card,
  CardContent,
} from "@/components/ui/card";

type Props = {
  healthScore: number | null;
  totalFiles: number | null;
  totalIssues: number | null;

  severityCounts: {
    error: number;
    warning: number;
    info: number;
  };
};

export default function RepositoryOverview({
  healthScore,
  totalFiles,
  totalIssues,
  severityCounts,
}: Props) {
  const health =
    healthScore ?? 100;

  const healthLabel =
    health >= 85
      ? "Healthy"
      : health >= 65
        ? "Needs attention"
        : "High risk";

  return (
    <section className="rounded-2xl border bg-background p-6 shadow-sm">
      {/* Health summary */}
      <div className="flex flex-col gap-6 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Repository health
          </p>

          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl font-semibold tracking-tight">
              {health}
            </span>

            <span className="mb-1 text-sm text-muted-foreground">
              /100
            </span>
          </div>

          <p className="mt-2 text-sm font-medium">
            {healthLabel}
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Overall score
            </span>

            <span className="font-medium">
              {health}%
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    health
                  )
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main metrics */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="shadow-none">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Files analyzed
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {totalFiles ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Issues detected
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {totalIssues ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Severity breakdown */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SeverityCard
          label="Errors"
          value={
            severityCounts.error
          }
          className="border-red-500/20 bg-red-500/5"
          valueClassName="text-red-600"
        />

        <SeverityCard
          label="Warnings"
          value={
            severityCounts.warning
          }
          className="border-yellow-500/20 bg-yellow-500/5"
          valueClassName="text-yellow-600"
        />

        <SeverityCard
          label="Info"
          value={
            severityCounts.info
          }
          className="border-blue-500/20 bg-blue-500/5"
          valueClassName="text-blue-600"
        />
      </div>
    </section>
  );
}

function SeverityCard({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: number;
  className: string;
  valueClassName: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
    >
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-semibold ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}