import { NextResponse } from "next/server";
import { db } from "@/db";
import { emailMessages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    
    if (!address) {
      return NextResponse.json({ success: false, messages: [] });
    }

    const list = await db
      .select()
      .from(emailMessages)
      .where(eq(emailMessages.emailAddress, address))
      .orderBy(desc(emailMessages.receivedAt));

    return NextResponse.json({ success: true, messages: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Error fetching messages" }, { status: 500 });
  }
}
