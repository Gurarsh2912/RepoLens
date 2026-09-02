import { ParsedFile } from "@/types/parser";
import { resolveImport } from "./resolveImport";

export type DependencyNode = {
  path: string;
  dependencies: string[];
};

export type DependencyGraph = Record<string, DependencyNode>;

export function buildDependencyGraph(
  parsedFiles: ParsedFile[]
): DependencyGraph {

  const graph: DependencyGraph = {};

  const allFilePaths = new Set(
    parsedFiles.map((file) => file.path)
  );

  // Create nodes
  for (const file of parsedFiles) {
    graph[file.path] = {
      path: file.path,
      dependencies: [],
    };
  }

  // Create edges
  for (const file of parsedFiles) {
    for (const importPath of file.imports) {

      const dependency = resolveImport(
        file.path,
        importPath,
        allFilePaths
      );

      if (dependency) {
        graph[file.path].dependencies.push(dependency);
      }
    }
  }

  return graph;
}