import { GithubRepoInfo } from "@/types/github";

export function parseGithubUrl(
  url: string
): GithubRepoInfo | null {
  try {
    const parsedUrl =
      new URL(url.trim());

    const hostname =
      parsedUrl.hostname.toLowerCase();

    // Only GitHub repository URLs
    if (
      hostname !== "github.com" &&
      hostname !== "www.github.com"
    ) {
      return null;
    }

    const parts =
      parsedUrl.pathname
        .split("/")
        .filter(Boolean);

    // Repository URL should be:
    // github.com/{owner}/{repo}
    if (parts.length !== 2) {
      return null;
    }

    const owner = parts[0];

    const repo =
      parts[1].replace(
        /\.git$/i,
        ""
      );

    if (!owner || !repo) {
      return null;
    }

    return {
      owner,
      repo,
    };
  } catch {
    return null;
  }
}