import { NextResponse } from 'next/server';
import { auth } from "@/features/auth/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Memory } from "@/lib/db/models/Memory";
import { User } from "@/lib/db/models/User";
import { upsertMemory, deleteMemory, deleteAllMemoriesForUser } from "@/lib/ai/memory/vector-store";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const memories = await Memory.find({ userId: { $in: [user._id, user._id.toString()] } }).sort({ createdAt: -1 });
    return NextResponse.json(memories);
  } catch (error) {
    console.error("Memory GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, category } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a placeholder pineconeId if vector DB isn't fully set up yet
    const pineconeId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newMemory = await Memory.create({
      userId: user._id,
      content,
      category: category || 'fact',
      pineconeId
    });

    try {
      await upsertMemory(user._id.toString(), pineconeId, content, category || 'fact');
    } catch (e) {
      console.warn("Could not sync memory to vector store", e);
    }

    return NextResponse.json(newMemory, { status: 201 });
  } catch (error) {
    console.error("Memory POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (id === 'all') {
      await Memory.deleteMany({ userId: { $in: [user._id, user._id.toString()] } });
      try {
        await deleteAllMemoriesForUser(user._id.toString());
      } catch (e) {}
    } else {
      const memory = await Memory.findOne({ _id: id, userId: { $in: [user._id, user._id.toString()] } });
      if (memory) {
        await Memory.deleteOne({ _id: id });
        try {
          await deleteMemory(memory.pineconeId);
        } catch (e) {}
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Memory DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
