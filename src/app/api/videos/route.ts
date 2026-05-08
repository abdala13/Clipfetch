import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoDownloads } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(videoDownloads).orderBy(desc(videoDownloads.downloadedAt));
    return NextResponse.json({ success: true, videos: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { url, format = "mp4", quality = "1080p" } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: "الرجاء إدخال رابط الفيديو بشكل صحيح" }, { status: 400 });
    }

    let platform = "موقع عام";
    let title = "فيديو محمل عالي الجودة - " + Math.floor(Math.random() * 9000);
    let thumbnail = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60";

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      platform = "YouTube";
      title = "فيديو يوتيوب احترافي عالي الدقة (Full HD)";
      thumbnail = "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60";
    } else if (lowerUrl.includes("tiktok.com")) {
      platform = "TikTok";
      title = "مقطع تيك توك حصري بدون علامة مائية (No Watermark)";
      thumbnail = "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=500&auto=format&fit=crop&q=60";
    } else if (lowerUrl.includes("instagram.com")) {
      platform = "Instagram";
      title = "إنستغرام ريلز (Reels) فائق الوضوح";
      thumbnail = "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=500&auto=format&fit=crop&q=60";
    } else if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
      platform = "Twitter / X";
      title = "تغريدة مرئية (X Video) مع الصوت الأصلي";
      thumbnail = "https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=500&auto=format&fit=crop&q=60";
    } else if (lowerUrl.includes("facebook.com")) {
      platform = "Facebook";
      title = "فيديو فيسبوك ووتش (FB Watch)";
      thumbnail = "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60";
    }

    const [inserted] = await db.insert(videoDownloads).values({
      url,
      platform,
      format,
      quality,
      title,
      thumbnail,
      status: "completed"
    }).returning();

    return NextResponse.json({ 
      success: true, 
      video: inserted,
      sampleDownloadUrl: `/api/videos/stream?title=${encodeURIComponent(title)}&format=${format}`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to process video" }, { status: 500 });
  }
}
