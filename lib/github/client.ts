import {
  GithubRepository,
  GithubTreeResponse,
} from "@/types/github";


const GITHUB_API_URL = "https://api.github.com";

export async function getRepository(
  owner: string,
  repo: string
): Promise<GithubRepository> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  return {
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    default_branch: data.default_branch,
    language: data.language,
    stargazers_count: data.stargazers_count,
  };
}

export async function getRepositoryTree(
  owner: string,
  repo: string,
  branch: string
): Promise<GithubTreeResponse> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub tree API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub file API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.content) {
    throw new Error(`No content found for ${path}`);
  }

  return Buffer.from(data.content, "base64").toString("utf-8");
}