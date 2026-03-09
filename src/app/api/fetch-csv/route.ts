import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = ["docs.google.com", "www.googleapis.com"];

/**
 * Convert a Google Sheet edit/view link to the public CSV export URL.
 * Edit links require auth and return 401; export?format=csv works when sheet is shared "Anyone with the link".
 */
function toGoogleSheetCsvExportUrl(url: string): string {
  const trimmed = url.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return trimmed;
  const spreadsheetId = match[1];
  const gidMatch = trimmed.match(/[?&]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

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

  let fetchUrl = parsed.toString();
  if (parsed.hostname.toLowerCase().replace(/^www\./, "") === "docs.google.com" && /\/spreadsheets\/d\/[a-zA-Z0-9_-]+/.test(parsed.pathname)) {
    fetchUrl = toGoogleSheetCsvExportUrl(parsed.toString());
  }

  try {
    const res = await fetch(fetchUrl, {
      headers: { "User-Agent": "Netreshwori-Website/1.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const message =
        res.status === 401
          ? "Sheet is private. Share it: open the sheet → Share → set to “Anyone with the link” can view, then try again."
          : res.status === 400
            ? "Sheet link may be incomplete or invalid. Copy the full URL from the browser address bar and ensure the sheet is shared (Anyone with the link can view)."
            : `Fetch failed: ${res.status}`;
      return NextResponse.json({ error: message }, { status: 502 });
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
