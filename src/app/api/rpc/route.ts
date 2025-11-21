import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Solana network URLs - fallback to generic ALCHEMY_API_URL
const URLS: Record<string, string | undefined> = {
  "solana-devnet": process.env.ALCHEMY_API_URL_SOLANA_DEVNET,
  "solana-mainnet": process.env.ALCHEMY_API_URL_SOLANA_MAINNET,
  "solana-testnet": process.env.ALCHEMY_API_URL_SOLANA_TESTNET,
};

export async function POST(request: NextRequest) {
  const chain = request.headers.get("x-chain") || "solana-devnet";
  const upstream = URLS[chain] || process.env.ALCHEMY_API_URL;

  if (!upstream) {
    return NextResponse.json(
      { error: `Missing upstream for chain "${chain}". Set ALCHEMY_API_URL or chain-specific env.` },
      { status: 500 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const res = await fetch(upstream, {
    method: "POST",
    headers: { "content-type": "application/json" }, // do not forward cookies or browser headers
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  let json: any;
  try {
    json = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Upstream returned non-JSON", status: res.status },
      { status: 502 }
    );
  }

  return NextResponse.json(json, {
    status: res.ok ? 200 : res.status || 502,
    headers: { "cache-control": "no-store" },
  });
}

