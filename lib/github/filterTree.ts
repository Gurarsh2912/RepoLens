import { GithubTreeItem } from "@/types/github";

const allowedExtensions = [".ts", ".tsx", ".js", ".jsx"];

const ignoredFolders = [
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  "vendor",
];

const ignoredFilePatterns = [
  "eslint.config",
  ".eslintrc",
  "prettier",
  "babel.config",
  "jest.config",
  "vitest.config",
  "next.config",
  "postcss.config",
  "tailwind.config",
];

const preferredFolders = [
  "src/",
  "app/",
  "pages/",
  "components/",
  "lib/",
  "server/",
  "services/",
];

export function filterSourceFiles(
  tree: GithubTreeItem[]
): GithubTreeItem[] {
  const filtered = tree.filter((item) => {
    if (item.type !== "blob") {
      return false;
    }

    const path = item.path.toLowerCase();

    const isIgnoredFolder = ignoredFolders.some((folder) =>
      path.includes(`${folder}/`)
    );

    if (isIgnoredFolder) {
      return false;
    }

    const isIgnoredFile = ignoredFilePatterns.some((pattern) =>
      path.includes(pattern)
    );

    if (isIgnoredFile) {
      return false;
    }

    const hasAllowedExtension = allowedExtensions.some((ext) =>
      path.endsWith(ext)
    );

    return hasAllowedExtension;
  });

  return filtered.sort((a, b) => {
    const aPreferred = preferredFolders.some((folder) =>
      a.path.startsWith(folder)
    );

    const bPreferred = preferredFolders.some((folder) =>
      b.path.startsWith(folder)
    );

    if (aPreferred && !bPreferred) {
      return -1;
    }

    if (!aPreferred && bPreferred) {
      return 1;
    }

    return 0;
  });
}