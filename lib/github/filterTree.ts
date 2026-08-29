import { GithubTreeItem } from "@/types/github";

const allowedExtensions = [".ts", ".tsx", ".js", ".jsx"];

const ignoredFolders = [
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
];

export function filterSourceFiles(
  tree: GithubTreeItem[]
): GithubTreeItem[] {
  return tree.filter((item) => {
    if (item.type !== "blob") {
      return false;
    }

    const isIgnored = ignoredFolders.some((folder) =>
      item.path.includes(`${folder}/`)
    );

    if (isIgnored) {
      return false;
    }

    const hasAllowedExtension = allowedExtensions.some((ext) =>
      item.path.endsWith(ext)
    );

    return hasAllowedExtension;
  });
}