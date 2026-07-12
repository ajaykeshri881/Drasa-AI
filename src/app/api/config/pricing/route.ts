import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { SystemConfig } from "@/lib/db/models/Admin";

// Cache this endpoint for 60 seconds to protect the database from high traffic
export const revalidate = 60;

export async function GET() {
  const defaultPricing = {
    free: 0,
    pro: 399,
    ultimate: 999
  };

  try {
    await connectDB();
    const config = await SystemConfig.findOne();

    if (config && config.pricing) {
      return NextResponse.json({
        free: 0,
        pro: config.pricing.proMonthly || defaultPricing.pro,
        ultimate: config.pricing.ultimateMonthly || defaultPricing.ultimate
      });
    }

    return NextResponse.json(defaultPricing);
  } catch (error) {
    console.error("Failed to fetch dynamic pricing, falling back to defaults:", error);
    // Absolute Fail-Safe: Never fail, always return hardcoded prices if DB is unreachable
    return NextResponse.json(defaultPricing);
  }
}
