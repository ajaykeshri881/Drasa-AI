import mongoose, { Schema } from "mongoose";

export interface IAdminAction {
  _id: string;
  adminId: mongoose.Types.ObjectId | string;
  actionType: "UPDATE_USER_PLAN" | "UPDATE_USER_ROLE" | "CREATE_MODEL" | "UPDATE_MODEL" | "DELETE_MODEL" | "CREATE_ALERT";
  targetId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AdminActionSchema = new Schema<IAdminAction>(
  {
    adminId: { type: Schema.Types.Mixed, required: true, index: true },
    actionType: { type: String, required: true, index: true },
    targetId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AdminAction = mongoose.models.AdminAction || mongoose.model<IAdminAction>("AdminAction", AdminActionSchema);
