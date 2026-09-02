import { DetectedIssue } from "@/types/issues";

export function calculateHealthScore(
  issues: DetectedIssue[]
): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.severity === "error") {
      score -= 10;
    } else if (issue.severity === "warning") {
      score -= 5;
    } else if (issue.severity === "info") {
      score -= 1;
    }
  }

  return Math.max(score, 0);
}