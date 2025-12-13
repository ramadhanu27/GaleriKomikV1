import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { chapterSlug: string } }) {
  const chapterSlug = params.chapterSlug;

  if (!chapterSlug) {
    return NextResponse.json({ success: false, error: "Missing chapter slug parameter" }, { status: 400 });
  }

  try {
    const apiUrl = `https://www.sankavollerei.com/comic/soulscan/chapter/${chapterSlug}`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();

    // Filter out invalid image URLs (like tracking pixels)
    if (data.success && data.result && data.result.imageUrls) {
      data.result.imageUrls = data.result.imageUrls.filter((url: string) => {
        // Filter out tracking pixels and invalid URLs
        if (!url) return false;
        if (url.includes("histats.com")) return false;
        if (url.startsWith("//")) return false;
        if (!url.startsWith("http")) return false;
        return true;
      });
      data.result.totalImages = data.result.imageUrls.length;
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Error fetching SoulScan chapter:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to fetch data" }, { status: 500 });
  }
}
