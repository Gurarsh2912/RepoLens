import {
  pgTable,
  text,
  timestamp,
  integer,
  serial,
  primaryKey,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
  }),
  image: text("image"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => users.id),

  githubUrl: text("github_url").notNull(),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  defaultBranch: text("default_branch").default("main"),
  language: text("language"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),

  repositoryId: integer("repository_id")
    .notNull()
    .references(() => repositories.id),

  commitSha: text("commit_sha"),
  status: text("status").default("pending").notNull(),

  totalFiles: integer("total_files").default(0),
  totalIssues: integer("total_issues").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyzedFiles = pgTable("analyzed_files", {
  id: serial("id").primaryKey(),

  analysisId: integer("analysis_id")
    .notNull()
    .references(() => analyses.id),

  path: text("path").notNull(),
  language: text("language"),

  linesOfCode: integer("lines_of_code").default(0),
  complexity: integer("complexity").default(0),
  functionCount: integer("function_count").default(0),
  dependencyCount: integer("dependency_count").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),

  analysisId: integer("analysis_id")
    .notNull()
    .references(() => analyses.id),

  fileId: integer("file_id")
    .references(() => analyzedFiles.id),

  rule: text("rule").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),

  line: integer("line"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),

    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [
        account.provider,
        account.providerAccountId,
      ],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  expires: timestamp("expires", {
    mode: "date",
  }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", {
      mode: "date",
    }).notNull(),
  },
  (token) => [
    primaryKey({
      columns: [token.identifier, token.token],
    }),
  ]
);