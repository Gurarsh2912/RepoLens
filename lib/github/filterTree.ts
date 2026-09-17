import { GithubTreeItem } from "@/types/github";

const allowedExtensions = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
];

const ignoredFolders = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  "vendor",
]);

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
  const filtered = tree.filter(
    (item) => {
      if (
        item.type !== "blob"
      ) {
        return false;
      }

      const path =
        item.path.toLowerCase();

      const pathSegments =
        path.split("/");

      const fileName =
        pathSegments[
          pathSegments.length - 1
        ];

      // Ignore generated/vendor folders.
      const isIgnoredFolder =
        pathSegments.some(
          (segment) =>
            ignoredFolders.has(
              segment
            )
        );

      if (isIgnoredFolder) {
        return false;
      }

      // Ignore config/tooling files.
      const isIgnoredFile =
        ignoredFilePatterns.some(
          (pattern) =>
            fileName.includes(
              pattern
            )
        );

      if (isIgnoredFile) {
        return false;
      }

      // Only analyze supported
      // source file types.
      return allowedExtensions.some(
        (extension) =>
          path.endsWith(
            extension
          )
      );
    }
  );

  return filtered.sort(
    (a, b) => {
      const aPath =
        a.path.toLowerCase();

      const bPath =
        b.path.toLowerCase();

      const aPreferred =
        preferredFolders.some(
          (folder) =>
            aPath.startsWith(
              folder
            )
        );

      const bPreferred =
        preferredFolders.some(
          (folder) =>
            bPath.startsWith(
              folder
            )
        );

      if (
        aPreferred &&
        !bPreferred
      ) {
        return -1;
      }

      if (
        !aPreferred &&
        bPreferred
      ) {
        return 1;
      }

      // Deterministic order
      // inside each group.
      return aPath.localeCompare(
        bPath
      );
    }
  );
}