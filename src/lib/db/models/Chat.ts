import mongoose, { Schema } from "mongoose";

export interface IMessage {
  _id: string;
  chatId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model: string;
  toolCalls?: any[];
  toolResults?: any[];
  attachments?: {
    url: string;
    type: "image" | "file" | "audio";
    name: string;
  }[];
  tokensUsed: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface IChat {
  _id: string;
  userId: mongoose.Types.ObjectId | string; // string for guest sessions
  title: string;
  isTemporary: boolean;
  model: string;
  mode: string; // chat, code, reasoning, vision, web
  folderId?: mongoose.Types.ObjectId;
  status: "generating" | "completed" | "failed";
  isDeleted: boolean;
  isPublic: boolean;  // whether the chat is publicly shareable
  sharedAt?: Date;    // when the chat was first made public
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    _id: { type: String, required: true },
    chatId: { type: String, ref: "Chat", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "system", "tool"], required: true },
    content: { type: String, default: "" },
    model: { type: String, required: true },
    toolCalls: { type: Schema.Types.Mixed },
    toolResults: { type: Schema.Types.Mixed },
    attachments: [
      {
        url: { type: String },
        type: { type: String, enum: ["image", "file", "audio"] },
        name: { type: String },
      },
    ],
    tokensUsed: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MessageSchema.index({ chatId: 1, createdAt: 1 });

const ChatSchema = new Schema<IChat>(
  {
    _id: { type: String, required: true },
    userId: { type: Schema.Types.Mixed, required: true, index: true }, // Mixed to allow ObjectId or Guest ID string
    title: { type: String, default: "New Chat" },
    isTemporary: { type: Boolean, default: false },
    model: { type: String, required: true },
    mode: { type: String, default: "chat" },
    folderId: { type: Schema.Types.ObjectId, ref: "Folder" },
    status: { type: String, enum: ["generating", "completed", "failed"], default: "completed" },
    isDeleted: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false, index: true },
    sharedAt: { type: Date },
  },
  { timestamps: true }
);

export const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
export const Chat = mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
