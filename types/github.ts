export type GithubRepoInfo = {
  owner: string;
  repo: string;
};

export type GithubRepository = {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
};

export type GithubTreeItem = {
  path: string;
  type: "blob" | "tree";
  sha: string;
};

export type GithubTreeResponse = {
  tree: GithubTreeItem[];
  truncated: boolean;
};