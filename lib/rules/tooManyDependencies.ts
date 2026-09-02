import { AnalysisRule } from "./types";

export const tooManyDependenciesRule: AnalysisRule = {
  id: "too-many-dependencies",

  run: ({ parsedFile }) => {
    const count = parsedFile.imports.length;

    if (count > 10) {
      return [
        {
          rule: "too-many-dependencies",
          severity: "warning",
          message: `File has ${count} dependencies and may be tightly coupled.`,
        },
      ];
    }

    return [];
  },
};