import { NextResponse } from "next/server";
import { db } from "@/db";
import { tempEmails, emailMessages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(tempEmails).orderBy(desc(tempEmails.createdAt));
    return NextResponse.json({ success: true, emails: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const customPrefix = body.prefix?.trim() || "modern";
    const domains = ["@tempbox.cloud", "@mailpro.io", "@fastdrop.net"];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const address = `${customPrefix}-${randomSuffix}${randomDomain}`;

    // Expires in 2 hours
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const [inserted] = await db.insert(tempEmails).values({
      address,
      expiresAt,
      isActive: true
    }).returning();

    // Insert an automated welcome message
    await db.insert(emailMessages).values({
      emailAddress: address,
      sender: "support@tempbox.cloud",
      subject: "🎉 مرحباً بك في خدمة البريد المؤقت الاحترافية!",
      body: `أهلاً بك في نظام البريد المؤقت العصري.
هذا البريد صالح لمدة ساعتين ويمكنك استقبال الرسائل وتأكيدات التسجيل هنا بشكل فوري ومباشر.
تم ربط هذا البريد بنجاح مع قاعدة البيانات. يمكنك إرسال رسالة تجريبية من خلال الزر المتاح في لوحة التحكم.`,
      isRead: false,
    });

    return NextResponse.json({ success: true, email: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to generate email" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    if (!address) {
      return NextResponse.json({ success: false, error: "Missing address" }, { status: 400 });
    }

    await db.delete(emailMessages).where(eq(emailMessages.emailAddress, address));
    await db.delete(tempEmails).where(eq(tempEmails.address, address));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
