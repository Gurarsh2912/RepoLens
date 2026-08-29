import { GithubRepoInfo } from "@/types/github";

export function parseGithubUrl(url: string): GithubRepoInfo | null {
  try {
    const parsedUrl = new URL(url);

    if(parsedUrl.hostname!=="github.com"){
        return null;
    }

    const parts = parsedUrl.pathname.split("/").filter(Boolean)

    if (parts.length < 2) {
      return null;
    }

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");

    if(!owner || !repo) return null;


    return {
      owner,
      repo,
    };
  } catch {
    return null;
  }
}