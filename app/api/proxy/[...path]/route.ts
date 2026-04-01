import { NextRequest, NextResponse } from "next/server";

const SIDECAR =
  process.env.NEXT_PUBLIC_SIDECAR_URL || "http://10.0.0.240:3077";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstream = `${SIDECAR}/${path.join("/")}${
    request.nextUrl.search
  }`;

  const res = await fetch(upstream, { cache: "no-store" });
  const body = await res.text();

  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}
