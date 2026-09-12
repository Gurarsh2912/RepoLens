import { RepositoryReviewContext } from "@/lib/ai/types";

export const FILE_REVIEW_SYSTEM_PROMPT = `
You are the explanation layer of RepoLens,
a static repository analysis tool.

You will receive deterministic metrics and
static-analysis findings for one source file.

Your job is to explain the findings clearly
and provide practical recommendations.

Rules:
- Do not invent vulnerabilities.
- Do not claim something exists unless the
  supplied analysis supports it.
- Distinguish measured facts from suggestions.
- Prefer concise, actionable recommendations.
- Do not repeat metrics unnecessarily.
`;

export const REPOSITORY_REVIEW_SYSTEM_PROMPT = `
You are the architecture explanation layer of RepoLens,
a static repository analysis tool.

You will receive deterministic repository-level metrics,
dependency relationships, important files,
source-code snippets, and static-analysis findings.

Your job is to explain the repository architecture,
identify maintainability risks, and provide practical
refactoring recommendations.

Rules:
- Do not invent files, dependencies, vulnerabilities,
  or architectural behavior.
- Use only the supplied RepoLens analysis as evidence.
- When source snippets are supplied, use them as direct evidence.
- Do not assume code outside the provided snippets.
- Separate metric-based observations from source-code-based observations.
- Distinguish measured facts from suggestions.
- Explain why each risk matters.
- Prefer concise, actionable recommendations.
- Do not claim to have inspected source code unless
  source code was explicitly supplied.
`;

export function buildRepositoryReviewPrompt(
  context: RepositoryReviewContext
) {
  const importantFilesText = context.importantFiles
    .map(
      (file) => `
- ${file.path}
  Complexity: ${file.complexity}
  Importance: ${file.importanceScore}
  Dependents: ${file.inDegree}
  Dependencies: ${file.outDegree}
  LOC: ${file.linesOfCode}
  Functions: ${file.functionCount}

  ${
    file.sourceSnippet
      ? `Source snippet:
${file.sourceSnippet}`
      : "Source snippet: Not included"
  }
`
    )
    .join("\n");

  const issuesText = context.issues
    .map(
      (issue) => `
- [${issue.severity}] ${issue.rule}
  ${issue.message}
  ${issue.line ? `Line: ${issue.line}` : ""}
`
    )
    .join("\n");

  const dependencyText = context.dependencies
    .map(
      (dependency) =>
        `- ${dependency.source} -> ${dependency.target}`
    )
    .join("\n");

  return `
Repository:
Name: ${context.repository.name}
Owner: ${context.repository.owner}
Language: ${context.repository.language ?? "Unknown"}
Default Branch: ${context.repository.defaultBranch ?? "Unknown"}

Analysis:
Health Score: ${context.analysis.healthScore}/100
Analyzed Files: ${context.analysis.totalFiles}
Detected Issues: ${context.analysis.totalIssues}

Most Important Files:
${importantFilesText || "No important-file data available."}

Static Analysis Findings:
${issuesText || "No findings available."}

Internal Dependencies:
${dependencyText || "No dependency data available."}

Return the review with these sections:

1. Architecture Summary
2. Key Modules and Important Files
3. Architectural Risks
4. Coupling and Dependency Concerns
5. Maintainability Concerns
6. Recommended Refactors

Use the supplied source snippets when making code-specific observations.
If a claim is based only on metrics or dependency data, make that clear.
`;
}