import { AnalysisRule } from "./types";

export const tooManyFunctionsRule: AnalysisRule = {
  id: "too-many-functions",

  run: ({ parsedFile }) => {
    const count = parsedFile.functions.length;

    if (count > 15) {
      return [
        {
          rule: "too-many-functions",
          severity: "warning",
          message: `File contains ${count} functions and may have too many responsibilities.`,
        },
      ];
    }

    return [];
  },
};