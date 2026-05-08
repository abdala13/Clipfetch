import { NextResponse } from "next/server";
import { db } from "@/db";
import { emailMessages } from "@/db/schema";

/**
 * 📥 REAL INBOUND EMAIL WEBHOOK ENDPOINT
 * ============================================================================
 * This endpoint processes real, live incoming emails posted by inbound gateways
 * (SendGrid Inbound Parse, Mailgun, Cloudflare Email Routing Webhooks, Postmark).
 * It automatically parses both Multipart FormData and JSON payloads, extracts
 * the recipient address, and saves the live email directly to Supabase Postgres.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let recipient = "";
    let sender = "";
    let subject = "";
    let bodyPlain = "";

    // 1. Handle Multipart Form Data (Standard for SendGrid Inbound Parse & Mailgun)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      // Extract mapped fields depending on standard providers
      recipient = (formData.get("to") || formData.get("recipient") || "").toString();
      sender = (formData.get("from") || formData.get("sender") || "").toString();
      subject = (formData.get("subject") || "").toString();
      bodyPlain = (formData.get("text") || formData.get("body-plain") || formData.get("html") || "").toString();

    } else {
      // 2. Handle standard JSON Webhooks (Cloudflare Webhooks / Custom Forwarders)
      const json = await request.json().catch(() => ({}));
      recipient = json.to || json.recipient || "";
      sender = json.from || json.sender || "";
      subject = json.subject || "بدون عنوان";
      bodyPlain = json.text || json.body_plain || json.html || json.body || "";
    }

    // Clean up extracted values
    if (!recipient) {
      return NextResponse.json({ success: false, error: "Missing recipient address" }, { status: 400 });
    }

    // Extract raw email if it comes in format like "Name <email@domain.com>"
    const emailMatch = recipient.match(/<([^>]+)>/);
    const cleanRecipient = emailMatch ? emailMatch[1].trim() : recipient.trim();

    const senderMatch = sender.match(/<([^>]+)>/);
    const cleanSender = senderMatch ? senderMatch[1].trim() : sender.trim();

    // Store the real message in our database
    const [inserted] = await db.insert(emailMessages).values({
      emailAddress: cleanRecipient,
      sender: cleanSender || "unknown-sender@external.io",
      subject: subject || "رسالة واردة جديدة",
      body: bodyPlain || "لا يوجد محتوى نصي للرسالة.",
      isRead: false
    }).returning();

    return NextResponse.json({ 
      success: true, 
      status: "inbound_processed",
      messageId: inserted.id,
      deliveredTo: cleanRecipient 
    });

  } catch (error: any) {
    console.error("Inbound Webhook Processing Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal Webhook Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "نقطة استقبال البريد الحقيقي (Inbound Webhook) جاهزة وتعمل بنجاح. يرجى توجيه مزود البريد (SendGrid/Mailgun/Cloudflare) لإرسال طلبات POST إلى هذا المسار."
  });
}
