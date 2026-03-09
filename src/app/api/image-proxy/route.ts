import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "drive.google.com",
  "www.drive.google.com",
  "lh3.googleusercontent.com",
  "dropbox.com",
  "www.dropbox.com",
  "dl.dropboxusercontent.com",
  "firebasestorage.googleapis.com",
];

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam?.trim()) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(decodeURIComponent(urlParam.trim()));
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (!ALLOWED_HOSTS.some((h) => host === h.replace(/^www\./, ""))) {
    return NextResponse.json({ error: "URL host not allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Netreshwori-Image-Proxy/1.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("image-proxy error:", e);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
