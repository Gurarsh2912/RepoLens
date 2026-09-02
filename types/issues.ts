export type IssueSeverity =
  | "info"
  | "warning"
  | "error";

export type DetectedIssue = {
  rule: string;
  severity: IssueSeverity;
  message: string;
  line?: number;
};