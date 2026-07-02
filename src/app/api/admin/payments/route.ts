import { NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Payment } from "@/lib/db/models/Subscription";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const plan = searchParams.get('plan') || '';
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) query.status = status;
    if (plan) query.plan = plan;

    const [payments, totalCount, revenueStats] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query),
      Payment.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            totalPayments: { $sum: 1 },
          }
        }
      ]),
    ]);

    return NextResponse.json({
      payments,
      totalRevenue: revenueStats.length > 0 ? revenueStats[0].totalRevenue / 100 : 0,
      totalPayments: revenueStats.length > 0 ? revenueStats[0].totalPayments : 0,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error: any) {
    console.error("Admin Payments GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json({ error: "paymentId and status are required" }, { status: 400 });
    }

    const validStatuses = ["success", "failed", "pending", "refunded"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await connectDB();

    const updated = await Payment.findByIdAndUpdate(
      paymentId,
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment: updated });

  } catch (error: any) {
    console.error("Admin Payments PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
