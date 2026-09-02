import { NextResponse } from "next/server";

import { getFileContent } from "@/lib/github/client";
import { parseSourceFile } from "@/lib/parser/parseSourceFile";

export async function GET() {
  try {
    const owner = "react";
    const repo = "react";

    const path = "packages/react/src/ReactClient.js";

    const code = await getFileContent(
      owner,
      repo,
      path
    );

    const parsed = parseSourceFile(
      path,
      code
    );

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to parse GitHub file" },
      { status: 500 }
    );
  }
}