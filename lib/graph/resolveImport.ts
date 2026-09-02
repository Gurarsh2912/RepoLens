import path from "path";

export function resolveImport(
  currentFile: string,
  importPath: string,
  allFilePaths: Set<string>
): string | null {

  // Ignore npm/external packages for now
  if (!importPath.startsWith(".") && !importPath.startsWith("@/")) {
    return null;
  }

  let basePath: string;

  if (importPath.startsWith("@/")) {
    basePath = importPath.slice(2);
  } else {
    const currentDirectory = path.posix.dirname(currentFile);

    basePath = path.posix.normalize(
      path.posix.join(currentDirectory, importPath)
    );
  }

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,

    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
    `${basePath}/index.js`,
    `${basePath}/index.jsx`,
  ];

  for (const candidate of candidates) {
    if (allFilePaths.has(candidate)) {
      return candidate;
    }
  }

  return null;
}