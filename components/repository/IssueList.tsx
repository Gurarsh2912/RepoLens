import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

type IssueData = {
  id: number;
  rule: string;
  severity: string;
  message: string;
  line: number | null;
  filePath: string;
};

type Props = {
  issues: IssueData[];
};

export default function IssueList({
  issues,
}: Props) {
  return (
    <section className="rounded-2xl border bg-background p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">
          Detected Issues
        </h2>

        <p className="text-sm text-muted-foreground">
          Static-analysis findings.
        </p>
      </div>

      <div className="space-y-3">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="rounded-xl border p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {issue.message}
                </p>

                <p className="mt-2 font-mono text-xs">
                  {issue.filePath}
                  {issue.line
                    ? `:${issue.line}`
                    : ""}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {issue.rule}
                </p>
              </div>

              <Badge
                variant={
                  issue.severity === "error"
                    ? "destructive"
                    : issue.severity === "warning"
                    ? "secondary"
                    : "outline"
                }
              >
                {issue.severity}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}