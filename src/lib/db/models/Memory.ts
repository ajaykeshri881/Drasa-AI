import mongoose, { Schema, Document } from "mongoose";

export interface IMemory extends Document {
  userId: mongoose.Types.ObjectId | string;
  content: string; // The raw fact/memory
  pineconeId: string; // ID linking to Pinecone vector
  category: "preference" | "fact" | "rule" | "project_context";
  sourceChatId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    content: { type: String, required: true },
    pineconeId: { type: String, required: true, unique: true },
    category: { 
      type: String, 
      enum: ["preference", "fact", "rule", "project_context"], 
      default: "fact" 
    },
    sourceChatId: { type: Schema.Types.ObjectId, ref: "Chat" },
  },
  { timestamps: true }
);

export const Memory = mongoose.models.Memory || mongoose.model<IMemory>("Memory", MemorySchema);
