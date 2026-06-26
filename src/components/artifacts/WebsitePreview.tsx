"use client";

import React, { useState, useEffect, useRef } from "react";
import { Monitor, Smartphone, Tablet, RefreshCw, Maximize2, Code2, Download, FileArchive } from "lucide-react";

interface WebsitePreviewProps {
  code: string;
  onClose?: () => void;
}

type ViewportMode = "desktop" | "tablet" | "mobile";

export function WebsitePreview({ code, onClose }: WebsitePreviewProps) {
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [iframeKey, setIframeKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setIframeKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drasa-website-build.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      
      // Inject standard template inside ZIP folder
      zip.file("index.html", processedCode);
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "drasa-website-build.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP creation failed:", err);
    }
  };

  // Inject Tailwind CDN automatically if it's missing but seems needed
  const processedCode = code.includes("<script src=\"https://cdn.tailwindcss.com\">") 
    ? code 
    : code.replace("</head>", "  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>");

  return (
    <div className="flex flex-col h-full bg-card dark:bg-[#1F1E1D] border-l border-border dark:border-[#33312E] w-full">
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-[#33312E] bg-background dark:bg-[#1A1918]">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 dark:bg-[#2A2928] rounded-lg p-1">
            <ToolbarButton 
              icon={<Monitor size={16} />} 
              active={viewport === "desktop"} 
              onClick={() => setViewport("desktop")} 
              title="Desktop"
            />
            <ToolbarButton 
              icon={<Tablet size={16} />} 
              active={viewport === "tablet"} 
              onClick={() => setViewport("tablet")} 
              title="Tablet"
            />
            <ToolbarButton 
              icon={<Smartphone size={16} />} 
              active={viewport === "mobile"} 
              onClick={() => setViewport("mobile")} 
              title="Mobile"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 dark:bg-[#2A2928] rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === "preview" ? "bg-background dark:bg-[#1A1918] text-foreground dark:text-[#E6E4DF] shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === "code" ? "bg-background dark:bg-[#1A1918] text-foreground dark:text-[#E6E4DF] shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Code
            </button>
          </div>
          {viewMode === "preview" && (
            <button 
              onClick={handleRefresh}
              className={`p-2 rounded-lg text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] hover:bg-muted dark:hover:bg-[#2A2928] transition-colors ${isRefreshing ? 'animate-spin text-primary' : ''}`}
              title="Refresh Preview"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button 
            onClick={handleDownload}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] hover:bg-muted dark:hover:bg-[#2A2928] transition-colors"
            title="Download HTML"
          >
            <Download size={16} />
          </button>
          <button 
            onClick={handleDownloadZip}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] hover:bg-muted dark:hover:bg-[#2A2928] transition-colors animate-in"
            title="Download ZIP Folder"
          >
            <FileArchive size={16} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] hover:bg-muted dark:hover:bg-[#2A2928] transition-colors ml-2"
              title="Close Preview"
            >
              <Maximize2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Browser Chrome & Iframe Container */}
      <div className="flex-1 bg-muted/30 dark:bg-[#121110] p-4 flex justify-center overflow-y-auto">
        <div 
          className={`bg-white rounded-xl shadow-lg border border-border dark:border-[#33312E] overflow-hidden transition-all duration-500 ease-in-out flex flex-col ${
            viewport === "desktop" ? "w-full h-full" : 
            viewport === "tablet" ? "w-[768px] h-full" : 
            "w-[375px] h-[812px] my-auto"
          }`}
        >
          {/* Mock Browser URL Bar */}
          <div className="flex items-center px-4 py-2 bg-gray-100 border-b border-gray-200 gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 text-center flex items-center justify-center gap-2">
              <Code2 size={12} />
              localhost:3000 / live-preview
            </div>
          </div>

          {/* Actual Sandbox or Code View */}
          {viewMode === "preview" ? (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              srcDoc={processedCode}
              title="Website Preview Sandbox"
              className="w-full flex-1 bg-white"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            />
          ) : (
            <div className="w-full flex-1 bg-[#1E1E1E] text-[#D4D4D4] p-4 overflow-y-auto overflow-x-auto text-sm font-mono whitespace-pre custom-scrollbar">
              {code}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ icon, active, onClick, title }: { icon: React.ReactNode, active: boolean, onClick: () => void, title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-all ${
        active 
          ? "bg-background dark:bg-[#1A1918] text-foreground dark:text-[#E6E4DF] shadow-sm" 
          : "text-muted-foreground dark:text-[#73726E] hover:text-foreground dark:hover:text-[#D4D2CD]"
      }`}
    >
      {icon}
    </button>
  );
}
