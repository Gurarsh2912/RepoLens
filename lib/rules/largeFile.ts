import { AnalysisRule } from "./types";

export const largeFileRule: AnalysisRule = {
  id: "large-file",

  run: ({ code }) => {
    const lines = code.split("\n").length;

    if (lines > 300) {
      return [
        {
          rule: "large-file",
          severity: "warning",
          message: `File has ${lines} lines and may be too large.`,
        },
      ];
    }

    return [];
  },
};