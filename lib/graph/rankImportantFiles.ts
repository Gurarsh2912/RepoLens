import { GraphMetric } from "./calculateGraphMetrics";

export type RankedFile = GraphMetric & {
  importanceScore: number;
};

export function rankImportantFiles(
  metrics: GraphMetric[]
): RankedFile[] {
  return metrics
    .map((file) => ({
      ...file,
      importanceScore:
        file.inDegree * 2 +
        file.outDegree,
    }))
    .sort(
      (a, b) =>
        b.importanceScore -
        a.importanceScore
    );
}