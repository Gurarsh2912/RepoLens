import { ParsedFile } from "@/types/parser";
import { DetectedIssue } from "@/types/issues";

export type RuleContext = {
  parsedFile: ParsedFile;
  code: string;
};

export type AnalysisRule = {
  id: string;

  run: (
    context: RuleContext
  ) => DetectedIssue[];
};