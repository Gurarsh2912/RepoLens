import { NextResponse } from "next/server";
import { parseSourceFile } from "@/lib/parser/parseSourceFile";

export async function GET() {
  const code = `
    export function hello() {}

class InternalService {}

export class UserService {}

export interface User {}

type InternalStatus = "x";

export type Status = "active";
  `;

  const result = parseSourceFile("test.ts", code);

  return NextResponse.json(result);
}