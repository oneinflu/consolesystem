import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "missing_url" }, { status: 400 });
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const get = (sel: string) => $(`meta[property="${sel}"]`).attr("content") || $(`meta[name="${sel}"]`).attr("content") || "";
    const data = {
      title: $("title").text() || get("og:title"),
      description: get("description") || get("og:description"),
      image: get("og:image"),
      site: get("og:site_name") || new URL(url).host,
      url
    };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "failed_fetch" }, { status: 500 });
  }
}
