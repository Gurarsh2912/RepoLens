import Link from "next/link";

import { Badge } from "@/components/ui/badge";

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
  return (
    <section className="rounded-2xl border bg-background p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">
          Important Files
        </h2>

        <p className="text-sm text-muted-foreground">
          Ranked by dependency importance.
        </p>
      </div>

      <div className="divide-y">
        {files.slice(0, 5).map((file, index) => (
          <Link
            href={`/repository/${repositoryId}/file/${file.id}`}
            key={file.id}
            className="block"
          >
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-medium">
                    {file.path}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {file.inDegree ?? 0} dependents
                    {" · "}
                    {file.outDegree ?? 0} dependencies
                  </p>
                </div>
              </div>

              <Badge variant="secondary">
                {file.importanceScore ?? 0}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}