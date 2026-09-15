import { z } from "zod";

export const repositoryReviewSchema =
  z.object({
    repositoryId: z
      .number()
      .int()
      .positive(),
  });

export const fileReviewSchema =
  z.object({
    fileId: z
      .number()
      .int()
      .positive(),
  });