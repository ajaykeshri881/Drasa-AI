import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Chat, Message } from "@/lib/db/models/Chat";
import { auth } from "@/features/auth/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    
    // For anonymous users, we might need a cookie-based guest ID. 
    // For now, if no session, we return empty or check a custom header.
    // Let's check headers for x-guest-id if no session.
    if (!userId) {
      const guestId = req.headers.get("x-guest-id");
      if (guestId) userId = guestId;
      else {
        userId = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
      }
    }

    await connectDB();
    const chats = await Chat.find({ userId, isDeleted: { $ne: true } }).sort({ updatedAt: -1 }).select("-__v");
    
    return NextResponse.json(chats);
  } catch (error: any) {
    console.error("Failed to fetch chats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    
    if (!userId) {
      const guestId = req.headers.get("x-guest-id");
      if (guestId) userId = guestId;
      else {
        userId = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
      }
    }

    await connectDB();
    await Chat.updateMany({ userId }, { $set: { isDeleted: true } });
    
    // Soft deletes so we do not delete messages
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to clear chats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
