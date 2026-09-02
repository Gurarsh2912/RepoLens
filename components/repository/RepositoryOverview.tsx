import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

type Props = {
  name: string;
  owner: string;
  language: string | null;
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
  name,
  owner,
  language,
  healthScore,
  totalFiles,
  totalIssues,
  severityCounts,
}: Props) {
  return (
    <section className="rounded-2xl border bg-background p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {name}
            </h1>

            <Badge variant="secondary">
              {language ?? "Unknown"}
            </Badge>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {owner}/{name}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-5xl font-semibold">
            {healthScore ?? 100}
          </span>

          <span className="mb-1 text-sm text-muted-foreground">
            /100 health
          </span>
        </div>
      </div>

      {/* Main summary cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="shadow-none">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Files analyzed
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {totalFiles ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Issues detected
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {totalIssues ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ADD SEVERITY COUNTS HERE */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">
            Errors
          </p>
          <p className="mt-1 text-xl font-semibold">
            {severityCounts.error}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">
            Warnings
          </p>
          <p className="mt-1 text-xl font-semibold">
            {severityCounts.warning}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">
            Info
          </p>
          <p className="mt-1 text-xl font-semibold">
            {severityCounts.info}
          </p>
        </div>
      </div>

      {/* ADD HEALTH BAR HERE */}
      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted-foreground">
            Repository health
          </span>

          <span className="font-medium">
            {healthScore ?? 100}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground"
            style={{
              width: `${healthScore ?? 100}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}