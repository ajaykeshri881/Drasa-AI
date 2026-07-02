import { NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { getPlanLimits } from "@/lib/config/plans";

// Cloudinary config will automatically use CLOUDINARY_URL environment variable

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size against max chunk size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const limits = getPlanLimits(user.plan);
    const maxDailyUploadBytes = limits.dailyUploadBytes;
    const currentBytesToday = user.usage?.bytesUploadedToday || 0;

    // Check last reset date
    const lastReset = user.usage?.lastResetDate ? new Date(user.usage.lastResetDate) : new Date(0);
    const now = new Date();
    
    // If different day, reset counters (ideally done via cron, but inline works as fallback)
    const isSameDay = lastReset.toDateString() === now.toDateString();
    const effectiveBytesToday = isSameDay ? currentBytesToday : 0;

    if (effectiveBytesToday + file.size > maxDailyUploadBytes) {
      return NextResponse.json(
        { error: `Upload quota exceeded. You have ${Math.max(0, (maxDailyUploadBytes - effectiveBytesToday) / 1024 / 1024).toFixed(2)}MB remaining today.` },
        { status: 429 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not supported` },
        { status: 400 }
      );
    }

    // Determine file category
    let fileType: "image" | "file" | "audio" = "file";
    if (file.type.startsWith("image/")) fileType = "image";
    else if (file.type.startsWith("audio/")) fileType = "audio";

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine Cloudinary resource type to prevent 401 Unauthorized on PDFs
    const cloudinaryResourceType = (file.type === 'application/pdf' || file.name.endsWith('.md') || file.name.endsWith('.txt')) 
      ? 'raw' 
      : 'auto';

    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'drasa-uploads',
          resource_type: cloudinaryResourceType,
          public_id: `${file.name.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // Update usage bytes
    const updateQuery = isSameDay 
      ? { $inc: { "usage.bytesUploadedToday": file.size }, $set: { "usage.lastResetDate": now } }
      : { $set: { "usage.bytesUploadedToday": file.size, "usage.lastResetDate": now } };

    await User.findByIdAndUpdate(session.user.id, updateQuery);

    return NextResponse.json({
      success: true,
      file: {
        url: uploadResult.secure_url,
        name: file.name,
        type: fileType,
        mimeType: file.type,
        size: file.size,
      },
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
