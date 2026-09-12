import { AnalysisRule } from "./types";
import { calculateComplexity } from "@/lib/analysis/calculateComplexity";

export const highComplexityRule: AnalysisRule = {
  id: "high-complexity",

  run: ({ parsedFile, code }) => {
    const complexity = calculateComplexity(
      parsedFile.path,
      code
    );

    if (complexity > 15) {
      return [
        {
          rule: "high-complexity",
          severity: "warning",
          message: `File has cyclomatic complexity ${complexity}, which may be difficult to maintain.`,
        },
      ];
    }

    return [];
  },
};