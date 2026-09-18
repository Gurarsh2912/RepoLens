# RepoLens

RepoLens is a full-stack repository analysis platform that helps developers understand the **structure, quality, architecture, and evolution** of JavaScript and TypeScript codebases.

It combines deterministic static analysis, AST parsing, dependency-graph analysis, complexity metrics, historical comparisons, and source-grounded AI reviews in a single developer-focused interface.

🔗 **Live Demo:** https://repo-lens-hazel.vercel.app

---

## Overview

Understanding an unfamiliar codebase usually means manually exploring files, tracing imports, identifying important modules, and looking for maintainability problems.

RepoLens automates much of that process.

Provide a GitHub repository URL and RepoLens will:

- analyze JavaScript and TypeScript source files
- parse source code using the TypeScript Compiler API
- extract functions, classes, interfaces, types, imports, and exports
- calculate file-level complexity
- detect static-analysis issues
- construct an internal dependency graph
- identify architecturally important files
- calculate a repository health score
- generate source-grounded AI reviews
- preserve historical analysis snapshots
- compare repository evolution across multiple runs

---

## Key Features

### Static Code Analysis

RepoLens contains a custom static-analysis engine for `.js`, `.jsx`, `.ts`, and `.tsx` files.

Current rules detect issues such as:

- high complexity
- large files
- excessive dependencies
- excessive functions
- deep nesting
- `console` statements
- use of `any`
- empty `catch` blocks

The static-analysis engine works independently of the AI layer.

---

### AST-Based Source Analysis

RepoLens uses the **TypeScript Compiler API** to parse source files into Abstract Syntax Trees.

It extracts structural information including:

- functions
- arrow functions
- classes
- class methods
- interfaces
- type aliases
- imports
- exports

This allows RepoLens to understand code structure without relying on an LLM.

---

### Dependency Graph

RepoLens builds an internal dependency graph using parsed imports.

Each file is treated as a graph node, while internal imports form directed edges.

For every analyzed file, RepoLens calculates:

- incoming dependencies
- outgoing dependencies
- architectural importance

The dependency graph is represented using an adjacency-list structure.

---

### Important File Detection

RepoLens ranks files using dependency-graph metrics.

The current importance score gives more weight to files that are depended upon by other modules.

This helps developers quickly identify central parts of an unfamiliar codebase instead of reading every file sequentially.

---

### Complexity Analysis

RepoLens calculates a file-level cyclomatic-style complexity score using control-flow structures such as:

- `if`
- loops
- `switch` cases
- `catch`
- ternary expressions
- logical `&&`
- logical `||`

Complexity values are also stored historically so changes between analysis runs can be compared.

---

### Repository Health Score

RepoLens calculates a deterministic health score using signals such as:

- issue severity
- complexity
- architectural importance
- hotspot characteristics

This provides a quick high-level view of repository maintainability.

---

### File-Level Analysis

Each analyzed file receives a dedicated detail page containing:

- lines of code
- complexity
- functions
- classes
- interfaces
- type aliases
- parsed imports
- dependencies
- dependents
- importance score
- static-analysis findings

---

### AI File Review

RepoLens can generate an AI-assisted explanation of an analyzed file.

The model receives deterministic RepoLens analysis as context and returns:

- summary
- strengths
- concerns
- recommendations

AI responses are runtime-validated using **Zod** before being shown to the user.

If the model returns malformed structured output, RepoLens retries once before returning a controlled error.

---

### Source-Grounded Repository Review

RepoLens can also generate repository-level architecture reviews.

Instead of sending the entire repository to the model, RepoLens selects important source files using signals such as:

```text
importance score
complexity
issue count
```

Selected source snippets are combined with:

- repository metrics
- dependency information
- static-analysis findings
- architectural importance

and supplied to the AI model as evidence.

RepoLens currently uses deterministic source selection rather than a full vector-database RAG pipeline.

---

### Analysis History

Every repository analysis creates a new snapshot instead of overwriting previous results.

Historical snapshots preserve:

- health score
- analyzed files
- detected issues
- complexity
- dependency information

This allows developers to track how a repository changes over time.

---

### Analysis Comparison

Historical analyses can be compared against the latest completed analysis.

RepoLens detects:

- newly introduced issues
- resolved issues
- health-score changes
- file-count changes
- issue-count changes
- per-file complexity changes

Issue comparison uses stable issue keys and `Set` lookups for efficient comparison.

---

## Reliability

RepoLens includes several production-focused reliability features.

### GitHub Reliability

The GitHub client includes:

- request timeouts
- rate-limit detection
- rate-limit reset information
- authentication error handling
- repository-not-found handling
- empty repository detection
- truncated repository-tree detection
- unsupported repository handling
- upstream outage handling
- partial file failure handling

RepoLens distinguishes between **recoverable file-level failures** and **repository-level failures**.

For example:

```text
One file becomes unavailable
        ↓
Skip that file
        ↓
Continue analysis
```

while:

```text
GitHub outage / rate limit / auth failure
        ↓
Abort repository analysis
        ↓
Mark analysis as failed
```

A successful analysis must contain at least one successfully analyzed source file.

---

### AI Reliability

The AI layer includes:

- ordered OpenRouter model fallbacks
- request timeouts
- empty-response detection
- invalid JSON handling
- runtime Zod validation
- malformed-response retry
- controlled provider errors

Most importantly, AI is isolated from the core analyzer.

If the AI provider is unavailable, RepoLens can still perform:

- AST parsing
- complexity analysis
- static analysis
- dependency graph construction
- health scoring
- history tracking

---

## Authentication & Authorization

RepoLens uses **GitHub OAuth with Auth.js**.

Authentication determines who the user is.

Authorization ensures that repository data belongs to the authenticated user before protected resources are returned.

Ownership checks protect routes for:

- repositories
- file analysis
- architecture
- historical analysis
- comparison
- AI repository reviews
- AI file reviews

Request payloads are validated using **Zod**.

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

- Next.js App Router
- Next.js Route Handlers
- Auth.js
- Zod

### Database

- PostgreSQL
- Neon
- Drizzle ORM

### Repository Analysis

- GitHub REST API
- TypeScript Compiler API
- Custom static-analysis engine
- Custom dependency-graph implementation

### AI

- OpenRouter
- Source-grounded repository context
- Multi-model fallback strategy
- Zod structured-output validation

### Deployment

- Vercel
- Neon PostgreSQL

---

## System Architecture

```text
                         GitHub Repository
                                │
                                ▼
                         GitHub REST API
                                │
                                ▼
                      Repository Tree Filter
                                │
                                ▼
                     Supported Source Files
                     (.js/.jsx/.ts/.tsx)
                                │
                                ▼
                 ┌──────────────────────────┐
                 │ Controlled Batch Engine  │
                 └──────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
           AST Parsing     Complexity      Static Rules
                │               │               │
                └───────────────┼───────────────┘
                                ▼
                        PostgreSQL / Neon
                                │
                                ▼
                     Dependency Graph Builder
                                │
                                ▼
                      Graph Metrics + Ranking
                                │
                                ▼
                          Health Scoring
                                │
                  ┌─────────────┴─────────────┐
                  ▼                           ▼
          Repository Dashboard        Source Selection
                                              │
                                              ▼
                                         OpenRouter
                                              │
                                              ▼
                                  Source-Grounded AI Review
```

---

## Analysis Pipeline

```text
GitHub Repository URL
        ↓
Validate Request
        ↓
Authenticate User
        ↓
Fetch Repository Metadata
        ↓
Fetch Repository Tree
        ↓
Filter Supported Source Files
        ↓
Process Files in Controlled Batches
        ↓
Fetch Source Code
        ↓
Calculate Complexity
        ↓
Parse AST
        ↓
Run Static-Analysis Rules
        ↓
Persist Files + Issues
        ↓
Build Dependency Graph
        ↓
Calculate Graph Metrics
        ↓
Rank Important Files
        ↓
Calculate Health Score
        ↓
Store Immutable Analysis Snapshot
```

---

## Project Structure

```text
app/
├── api/
│   ├── ai/
│   └── repositories/
│
├── dashboard/
│
└── repository/
    └── [id]/
        ├── architecture/
        ├── file/
        └── analysis/

components/
└── repository/

db/
├── index.ts
└── schema.ts

lib/
├── ai/
├── analysis/
├── auth/
├── github/
├── graph/
├── parser/
├── rules/
└── validation/

types/
```

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/Gurarsh2912/RepoLens.git
cd RepoLens
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file:

```env
DATABASE_URL=

GITHUB_TOKEN=

AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_SECRET=

OPENROUTER_API_KEY=
```

Never commit `.env.local` or production credentials to Git.

### 4. Configure GitHub OAuth

For local development, configure your GitHub OAuth application with:

```text
Homepage URL:
http://localhost:3000

Authorization callback URL:
http://localhost:3000/api/auth/callback/github
```

### 5. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Production

RepoLens is deployed on **Vercel** with **Neon PostgreSQL**.

🔗 https://repo-lens-hazel.vercel.app

---

## Current Limitations

The current version intentionally keeps repository analysis controlled and predictable.

- supports JavaScript and TypeScript repositories
- analyzes `.js`, `.jsx`, `.ts`, and `.tsx` files
- currently analyzes up to 25 supported files per run
- complexity is calculated as an aggregate file-level cyclomatic-style metric
- dependency analysis focuses on internal imports
- AI context selection is deterministic rather than vector-based RAG
- very large repositories may be rejected when GitHub returns a truncated tree

---

## Future Improvements

Potential future improvements include:

- Tree-sitter support for additional programming languages
- background jobs for large repository analysis
- vector-based semantic retrieval
- pull-request analysis
- repository-wide semantic search
- advanced graph-centrality algorithms
- interactive dependency graph visualization
- additional static-analysis rules
- larger repository support

---

## Engineering Principles

RepoLens was intentionally designed so that the LLM is **not the analyzer**.

```text
Deterministic Analysis
        ↓
Produces Facts

AI
        ↓
Explains Those Facts
```

This separation keeps the core system predictable, testable, and useful even when the AI provider is unavailable.

The project explores several software-engineering concepts together:

- AST parsing
- graph algorithms
- static analysis
- REST API integration
- OAuth authentication
- authorization
- relational database design
- runtime validation
- controlled concurrency
- fault isolation
- historical snapshots
- AI integration
- source grounding
- production deployment

---

## Author

**Gurarsh Deep**

GitHub: [@Gurarsh2912](https://github.com/Gurarsh2912)

---

⭐ If you found RepoLens useful or interesting, consider starring the repository.
