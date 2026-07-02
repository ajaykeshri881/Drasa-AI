import { NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { cancelSubscription } from "@/features/payments/lib/razorpay";
import { isValidPlan } from "@/lib/config/plans";
import { AdminUserUpdateSchema } from "@/lib/validations/api";
import { AdminAction } from "@/lib/db/models/AdminAction";

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    // Require admin authentication
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('name email role plan createdAt usage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error: any) {
    console.error("Admin Users API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = AdminUserUpdateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: parsedData.error.errors[0].message }, { status: 400 });
    }

    const { userId, plan, role } = parsedData.data;

    const updates: Record<string, any> = {};
    const unsets: Record<string, any> = {};

    if (plan) {
      if (!isValidPlan(plan)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      updates.plan = plan;
      
      // If plan is changed, we should cancel any existing auto-pay to prevent unexpected charges.
      await connectDB();
      const userToUpdate = await User.findById(userId);
      if (userToUpdate && userToUpdate.razorpaySubscriptionId) {
        try {
          await cancelSubscription(userToUpdate.razorpaySubscriptionId);
        } catch (e) {
          console.error("Admin cancel subscription failed:", e);
        }
        unsets.razorpaySubscriptionId = "";
        unsets.planExpiryDate = "";
      }
    }

    if (role) {
      if (!["user", "admin"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    await connectDB();

    const updatePayload: any = { $set: updates };
    if (Object.keys(unsets).length > 0) {
      updatePayload.$unset = unsets;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updatePayload,
      { new: true }
    ).select('name email role plan createdAt');

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (plan) {
      await AdminAction.create({
        adminId: session.user.id,
        actionType: "UPDATE_USER_PLAN",
        targetId: userId,
        metadata: { newPlan: plan }
      });
    }

    if (role) {
      await AdminAction.create({
        adminId: session.user.id,
        actionType: "UPDATE_USER_ROLE",
        targetId: userId,
        metadata: { newRole: role }
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error: any) {
    console.error("Admin Users PATCH Error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
