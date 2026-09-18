# RepoLens

RepoLens is a full-stack repository analysis platform that helps developers understand the structure, quality, and evolution of JavaScript and TypeScript codebases.

It combines deterministic static analysis, AST parsing, dependency-graph analysis, complexity metrics, historical comparisons, and source-grounded AI reviews in one interface.

🔗 **Live Demo:** https://repo-lens-hazel.vercel.app

---

## Why RepoLens?

Understanding an unfamiliar codebase usually requires manually searching through files, imports, dependencies, large modules, and potential maintainability issues.

RepoLens automates much of that process.

Given a GitHub repository, RepoLens can:

- analyze JavaScript and TypeScript source files
- parse code using the TypeScript Compiler API
- detect functions, classes, interfaces, types, imports, and exports
- calculate file-level complexity
- detect static-analysis issues
- build an internal dependency graph
- rank architecturally important files
- calculate repository health
- generate source-grounded AI reviews
- preserve analysis history
- compare repository evolution across analysis runs

---

## Features

### Static Code Analysis

RepoLens analyzes `.js`, `.jsx`, `.ts`, and `.tsx` files and applies custom static-analysis rules.

Current checks include:

- high file complexity
- large files
- excessive dependencies
- excessive functions
- deep nesting
- `console` statements
- usage of `any`
- empty catch blocks

The deterministic analyzer works independently of the AI layer.

---

### AST-Based Source Analysis

RepoLens uses the TypeScript Compiler API to parse source files and extract structural information including:

- functions
- arrow functions
- classes
- class methods
- interfaces
- type aliases
- imports
- exports

This allows RepoLens to understand source-code structure without relying on an LLM.

---

### Dependency Graph

RepoLens builds an adjacency-list representation of internal repository dependencies.

For each analyzed file, it calculates:

- incoming dependencies
- outgoing dependencies
- dependency importance

The current importance score is derived from dependency relationships and is used to identify central modules in the repository.

---

### Repository Health Score

RepoLens calculates a health score using deterministic analysis data such as:

- issue severity
- complexity
- architectural importance
- hotspot characteristics

This provides a quick overview of areas that may deserve additional attention.

---

### Important File Detection

Files are ranked using dependency-graph metrics so users can quickly identify modules with greater architectural influence.

This is useful when exploring an unfamiliar codebase because developers can focus on important files first instead of reading the repository sequentially.

---

### File-Level Analysis

Each analyzed file has its own detailed view containing:

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

The AI receives deterministic RepoLens analysis as context and returns:

- summary
- strengths
- concerns
- recommendations

AI output is runtime-validated with Zod before being shown to the user.

Malformed structured responses are retried once before returning a controlled error.

---

### Source-Grounded Repository Review

RepoLens also generates repository-level architecture reviews.

Instead of sending the entire repository to the model, RepoLens prioritizes source files using signals such as:

```text
importanceScore
complexity
issue count
