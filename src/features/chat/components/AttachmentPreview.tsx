import React from "react";
import { FileText, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface UploadedFile {
  url: string;
  name: string;
  type: "image" | "file" | "audio";
  mimeType: string;
  size: number;
  progress?: number;
}

interface AttachmentPreviewProps {
  files: UploadedFile[];
  onRemove: (index: number) => void;
}

export function AttachmentPreview({ files, onRemove }: AttachmentPreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pt-3">
      {files.map((file, idx) => (
        <div
          key={idx}
          className="relative flex items-center gap-2 bg-muted dark:bg-[#2A2928] border border-border/50 dark:border-[#33312E] rounded-xl px-3 py-1.5 text-xs group overflow-hidden"
        >
          {file.progress !== undefined && file.progress < 100 && (
            <div 
              className="absolute left-0 bottom-0 h-full bg-primary/10 dark:bg-[#C36A4F]/20 transition-all duration-300 -z-10"
              style={{ width: `${file.progress}%` }}
            />
          )}
          {file.type === "image" ? (
            <Image src={file.url} alt={file.name} width={20} height={20} className="w-5 h-5 rounded object-cover z-10" />
          ) : (
            <FileText size={14} className="text-primary dark:text-[#C36A4F] z-10" />
          )}
          <span className="text-foreground/80 dark:text-[#D4D2CD] max-w-[120px] truncate z-10 flex items-center gap-1">
            {file.name}
            {file.progress !== undefined && file.progress < 100 && (
              <span className="text-[10px] text-primary font-medium ml-1 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> {file.progress}%
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="p-0.5 text-muted-foreground hover:text-destructive dark:hover:text-red-400 transition-colors z-10"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
