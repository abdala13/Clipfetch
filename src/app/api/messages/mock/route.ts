import { NextResponse } from "next/server";
import { db } from "@/db";
import { emailMessages } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const { address, platform } = await request.json();
    if (!address) {
      return NextResponse.json({ success: false, error: "Missing email address" }, { status: 400 });
    }

    let sender = "noreply@platform.com";
    let subject = "رمز التحقق الخاص بك";
    let body = "مرحباً، رمز التحقق الخاص بك هو: 849201";

    if (platform === "netflix") {
      sender = "info@mailer.netflix.com";
      subject = "رمز تسجيل الدخول المؤقت لـ Netflix";
      body = `أهلاً بك في Netflix!
رمز الدخول الآمن الخاص بك هو: NF-99231
صالح لمدة 15 دقيقة. لا تشارك هذا الرمز مع أحد.`;
    } else if (platform === "github") {
      sender = "noreply@github.com";
      subject = "[GitHub] Please verify your device";
      body = `Hey there,
A new sign-in was detected from a new IP address.
Verification code: 442-881.
If this wasn't you, please reset your password immediately.`;
    } else if (platform === "steam") {
      sender = "noreply@steampowered.com";
      subject = "Steam Guard: Your Access Code";
      body = `Dear User,
Here is the Steam Guard code you need to login to your account:
👉 WX89P
Enjoy your gaming session!`;
    } else {
      sender = "verify@social-network.io";
      subject = "تأكيد الحساب الجديد";
      body = `شكراً لاستخدامك بريدنا المؤقت. تم تفعيل الحساب بنجاح.`;
    }

    const [inserted] = await db.insert(emailMessages).values({
      emailAddress: address,
      sender,
      subject,
      body,
      isRead: false
    }).returning();

    return NextResponse.json({ success: true, message: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
