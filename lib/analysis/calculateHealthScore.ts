import { DetectedIssue } from "@/types/issues";

type FileHealthData = {
  complexity: number;
  importanceScore: number;
};

export function calculateHealthScore(
  issues: DetectedIssue[],
  files: FileHealthData[]
): number {
  let score = 100;

  // 1. Issue penalties
  for (const issue of issues) {
    if (issue.severity === "error") {
      score -= 8;
    } else if (issue.severity === "warning") {
      score -= 3;
    } else if (issue.severity === "info") {
      score -= 1;
    }
  }

  // 2. Complexity penalties
  for (const file of files) {
    if (file.complexity > 25) {
      score -= 5;
    } else if (file.complexity > 15) {
      score -= 3;
    } else if (file.complexity > 10) {
      score -= 1;
    }
  }

  // 3. Architectural hotspot penalty
  for (const file of files) {
    if (
      file.importanceScore >= 8 &&
      file.complexity > 15
    ) {
      score -= 3;
    }
  }

  return Math.max(0, Math.min(100, score));
}