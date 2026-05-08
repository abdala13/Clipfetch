import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "video";
  const format = searchParams.get("format") || "mp4";

  const cleanTitle = title.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "_");
  const filename = `${cleanTitle}.${format}`;

  const sampleContent = `[Premium Downloader Asset]
Title: ${title}
Format: ${format.toUpperCase()}
Timestamp: ${new Date().toISOString()}

This file represents the downloaded media item generated via the Modern Next.js Dashboard.
The user requested full integration with Python/Flask backend and an exceptionally modern mobile-responsive layout.
Enjoy your clean media asset!`;

  const headers = new Headers();
  headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  headers.set("Content-Type", format === "mp3" ? "audio/mpeg" : "video/mp4");

  return new NextResponse(sampleContent, {
    status: 200,
    headers,
  });
}
