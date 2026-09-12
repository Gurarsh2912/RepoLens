export type AIMessage = {
  role: "system" | "user";
  content: string;
};

export type AIProvider = {
  generate(
    messages: AIMessage[]
  ): Promise<string>;
};

export type RepositoryImportantFile = {
  path: string;

  complexity: number;
  importanceScore: number;

  inDegree: number;
  outDegree: number;

  linesOfCode: number;
  functionCount: number;

  sourceSnippet?: string;
};

export type RepositoryIssue = {
  rule: string;
  severity: string;
  message: string;
  line: number | null;
};

export type RepositoryDependency = {
  source: string;
  target: string;
};

export type RepositoryReviewContext = {
  repository: {
    name: string;
    owner: string;
    language: string | null;
    defaultBranch: string | null;
  };

  analysis: {
    healthScore: number;
    totalFiles: number;
    totalIssues: number;
  };

  importantFiles: RepositoryImportantFile[];

  issues: RepositoryIssue[];

  dependencies: RepositoryDependency[];
};