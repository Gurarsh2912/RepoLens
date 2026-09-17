import {
  GithubRepository,
  GithubTreeResponse,
} from "@/types/github";

const GITHUB_API_URL =
  "https://api.github.com";

export type GitHubErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "REQUEST_FAILED"
  | "NO_CONTENT"
  | "TREE_TRUNCATED"
  | "EMPTY_REPOSITORY";

export class GitHubApiError extends Error {
  code: GitHubErrorCode;
  status: number;
  resetAt?: Date;

  constructor({
    message,
    code,
    status,
    resetAt,
  }: {
    message: string;
    code: GitHubErrorCode;
    status: number;
    resetAt?: Date;
  }) {
    super(message);

    this.name =
      "GitHubApiError";

    this.code = code;
    this.status = status;
    this.resetAt = resetAt;
  }
}

function getGithubHeaders() {
  const headers: Record<
    string,
    string
  > = {
    Accept:
      "application/vnd.github+json",

    "X-GitHub-Api-Version":
      "2022-11-28",
  };

  /*
   * Only send Authorization when
   * a token actually exists.
   */
  if (
    process.env.GITHUB_TOKEN
  ) {
    headers.Authorization =
      `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function githubFetch(
  url: string
) {
  let response: Response;

  try {
    response =
      await fetch(url, {
        headers:
          getGithubHeaders(),

        cache: "no-store",

        signal:
          AbortSignal.timeout(
            15_000
          ),
      });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name ===
        "TimeoutError" ||
        error.name ===
          "AbortError")
    ) {
      throw new GitHubApiError({
        message:
          "GitHub request timed out.",
        code: "UPSTREAM_ERROR",
        status: 504,
      });
    }

    throw new GitHubApiError({
      message:
        "Unable to connect to GitHub.",
      code: "UPSTREAM_ERROR",
      status: 503,
    });
  }

  if (response.ok) {
    return response;
  }

  const githubMessage =
    await getGithubErrorMessage(
      response
    );

  const rateLimitRemaining =
    response.headers.get(
      "x-ratelimit-remaining"
    );

  const rateLimitReset =
    response.headers.get(
      "x-ratelimit-reset"
    );

  const retryAfter =
    response.headers.get(
      "retry-after"
    );

  let resetAt:
    | Date
    | undefined;

  if (rateLimitReset) {
    resetAt = new Date(
      Number(
        rateLimitReset
      ) * 1000
    );
  } else if (retryAfter) {
    resetAt = new Date(
      Date.now() +
        Number(
          retryAfter
        ) *
          1000
    );
  }

  if (
    response.status === 404
  ) {
    throw new GitHubApiError({
      message:
        "Repository or resource not found or inaccessible.",
      code: "NOT_FOUND",
      status: 404,
    });
  }

  if (
    response.status === 401
  ) {
    throw new GitHubApiError({
      message:
        "GitHub authentication failed.",
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  const secondaryRateLimit =
    githubMessage
      ?.toLowerCase()
      .includes(
        "secondary rate limit"
      ) ?? false;

  if (
    response.status === 429 ||
    (response.status === 403 &&
      (rateLimitRemaining ===
        "0" ||
        secondaryRateLimit))
  ) {
    throw new GitHubApiError({
      message:
        "GitHub API rate limit exceeded. Please try again later.",
      code: "RATE_LIMITED",
      status: 429,
      resetAt,
    });
  }

  if (
    response.status === 403
  ) {
    throw new GitHubApiError({
      message:
        githubMessage ||
        "Access to this GitHub resource is forbidden.",
      code: "FORBIDDEN",
      status: 403,
    });
  }

  if (
    response.status >= 500
  ) {
    throw new GitHubApiError({
      message:
        "GitHub is temporarily unavailable.",
      code: "UPSTREAM_ERROR",
      status: 503,
    });
  }

  throw new GitHubApiError({
    message:
      githubMessage ||
      "GitHub request failed.",
    code: "REQUEST_FAILED",
    status: response.status,
  });
}

async function getGithubErrorMessage(
  response: Response
): Promise<string | null> {
  try {
    const data =
      await response.json();

    if (
      data &&
      typeof data ===
        "object" &&
      "message" in data &&
      typeof data.message ===
        "string"
    ) {
      return data.message;
    }
  } catch {
    // GitHub did not return JSON.
  }

  return null;
}

export async function getRepository(
  owner: string,
  repo: string
): Promise<GithubRepository> {
  const response =
    await githubFetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}`
    );

  const data =
    await response.json();

  return {
    name: data.name,
    full_name:
      data.full_name,
    description:
      data.description,
    default_branch:
      data.default_branch,
    language:
      data.language,
    stargazers_count:
      data.stargazers_count,
  };
}

export async function getRepositoryTree(
  owner: string,
  repo: string,
  branch: string
): Promise<GithubTreeResponse> {
  let response: Response;

  try {
    response =
      await githubFetch(
        `${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(
          branch
        )}?recursive=1`
      );
  } catch (error) {
    if (
      error instanceof
        GitHubApiError &&
      error.status === 409
    ) {
      throw new GitHubApiError({
        message:
          "This repository is empty and has no files to analyze.",
        code: "EMPTY_REPOSITORY",
        status: 422,
      });
    }

    throw error;
  }

  const data:
    GithubTreeResponse =
      await response.json();

  if (data.truncated) {
    throw new GitHubApiError({
      message:
        "Repository tree is too large for the current analyzer.",
      code: "TREE_TRUNCATED",
      status: 422,
    });
  }

  return data;
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const response =
    await githubFetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${encodePath(
        path
      )}`
    );

  const data =
    await response.json();

  if (
    !data.content ||
    typeof data.content !==
      "string"
  ) {
    throw new GitHubApiError({
      message:
        `No source content available for ${path}.`,
      code: "NO_CONTENT",
      status: 422,
    });
  }

  return Buffer.from(
    data.content.replace(
      /\n/g,
      ""
    ),
    "base64"
  ).toString("utf-8");
}

function encodePath(
  path: string
) {
  return path
    .split("/")
    .map((part) =>
      encodeURIComponent(part)
    )
    .join("/");
}