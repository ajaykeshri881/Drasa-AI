import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { SponsorHighlight } from "@/lib/db/models/Admin";

// Optional: Prevent aggressive caching so it changes randomly
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    
    // Fetch all active sponsors
    const activeSponsors = await SponsorHighlight.find({ isActive: true });
    
    if (activeSponsors.length === 0) {
      return NextResponse.json({ sponsor: null });
    }
    
    // Pick one randomly
    const randomIndex = Math.floor(Math.random() * activeSponsors.length);
    const selectedSponsor = activeSponsors[randomIndex];
    
    return NextResponse.json({ sponsor: selectedSponsor });
  } catch (error: any) {
    console.error("Active Sponsors GET Error:", error);
    return NextResponse.json({ sponsor: null });
  }
}
