import { DependencyGraph } from "./buildDependencyGraph";

export type GraphMetric = {
  path: string;
  inDegree: number;
  outDegree: number;
};

export function calculateGraphMetrics(
  graph: DependencyGraph
): GraphMetric[] {
  const metrics: Record<string, GraphMetric> = {};

  // Step 1: initialize every node
  for (const path in graph) {
    metrics[path] = {
      path,
      inDegree: 0,
      outDegree: graph[path].dependencies.length,
    };
  }

  // Step 2: calculate in-degree
  for (const path in graph) {
    for (const dependency of graph[path].dependencies) {
      if (metrics[dependency]) {
        metrics[dependency].inDegree++;
      }
    }
  }

  return Object.values(metrics);
}