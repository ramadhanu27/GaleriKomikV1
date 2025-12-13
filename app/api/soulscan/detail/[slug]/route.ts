import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;

  if (!slug) {
    return NextResponse.json({ success: false, error: "Missing slug parameter" }, { status: 400 });
  }

  try {
    const apiUrl = `https://www.sankavollerei.com/comic/soulscan/detail/${slug}`;

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

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching SoulScan detail:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to fetch data" }, { status: 500 });
  }
}
