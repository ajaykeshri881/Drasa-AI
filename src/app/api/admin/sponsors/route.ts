import { NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { SponsorHighlight } from "@/lib/db/models/Admin";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const sponsors = await SponsorHighlight.find().sort({ createdAt: -1 });
    return NextResponse.json(sponsors);
  } catch (error: any) {
    console.error("Admin Sponsors GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch sponsor highlights" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, linkText, linkUrl, isActive } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    await connectDB();
    const sponsor = await SponsorHighlight.create({
      title, description, linkText, linkUrl, isActive: isActive ?? true
    });

    return NextResponse.json(sponsor, { status: 201 });
  } catch (error: any) {
    console.error("Admin Sponsors POST Error:", error);
    return NextResponse.json({ error: "Failed to create sponsor highlight" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const updated = await SponsorHighlight.findByIdAndUpdate(id, { $set: updates }, { new: true });

    if (!updated) {
      return NextResponse.json({ error: "Sponsor highlight not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Admin Sponsors PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update sponsor highlight" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const deleted = await SponsorHighlight.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Sponsor highlight not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin Sponsors DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete sponsor highlight" }, { status: 500 });
  }
}
