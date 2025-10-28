import { NextResponse } from "next/server";
import { chat } from "@/lib/ai";
import { SYSTEM_VOTE } from "@/lib/prompts";
import { civicLookup } from "@/lib/tools";

type CivicResponse = Record<string, unknown>;

export async function POST(req: Request) {
  try {
    const { address } = await req.json() as { address: string };
    if (!address || typeof address !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'address' string" }, { status: 400 });
    }

    // 1) Civic info lookup (requires CIVIC_API_KEY to be set)
    const civ = await civicLookup(address);
    const civicData: CivicResponse = civ.data ?? {};

    // 2) Summarize logistics + highlight ballot elements
    const summary = await chat(
      SYSTEM_VOTE,
      `Address: ${address}\nCivic data (JSON):\n${JSON.stringify(civicData).slice(0, 6000)}\n\nReturn: 
- What elections/contests are present (if any).
- Logistics (dates, ways to vote if present).
- Clear next steps for the voter.`
    );

    return NextResponse.json({
      ok: true,
      address,
      summary,
      raw: civicData, // keep raw for UI details/links
    });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}