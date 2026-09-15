import { z } from "zod";

export const analyzeRepositorySchema =
  z.object({
    githubUrl: z
      .string()
      .trim()
      .min(
        1,
        "GitHub URL is required"
      )
      .url(
        "Invalid repository URL"
      ),
  });