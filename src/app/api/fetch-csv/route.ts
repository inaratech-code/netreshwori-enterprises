import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = ["docs.google.com", "www.googleapis.com"];

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam?.trim()) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(urlParam.trim());
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname.toLowerCase())) {
    return NextResponse.json(
      { error: "URL must be from Google (e.g. published Sheet CSV link)" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Netreshwori-Website/1.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${res.status}` },
        { status: 502 }
      );
    }
    const text = await res.text();
    return new NextResponse(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    console.error("fetch-csv error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch URL" },
      { status: 502 }
    );
  }
}
