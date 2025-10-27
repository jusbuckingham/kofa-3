import { NextRequest, NextResponse } from "next/server";
import { agent } from "@/lib/agent";

export async function POST(req: NextRequest) {
  const { task, input } = await req.json();
  const output = await agent(task, input);
  return NextResponse.json({ output });
}