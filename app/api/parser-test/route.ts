import { NextResponse } from "next/server";

import {
  getRepository,
  getRepositoryTree,
  getFileContent,
} from "@/lib/github/client";

import { filterSourceFiles } from "@/lib/github/filterTree";
import { parseSourceFile } from "@/lib/parser/parseSourceFile";

export async function GET() {
  try {
    const repo = await getRepository("react", "react");

    const tree = await getRepositoryTree(
      "react",
      "react",
      repo.default_branch
    );

    const sourceFiles = filterSourceFiles(tree.tree);

    const firstFile = sourceFiles.find(
    (file) => file.path === "packages/react/src/ReactClient.js"
    );
    if (!firstFile) {
    throw new Error("No source file found");
    }

    const content = await getFileContent(
      "react",
      "react",
      firstFile.path
    );

    const parsed = parseSourceFile(
      firstFile.path,
      content
    );

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Parser test failed" },
      { status: 500 }
    );
  }
}