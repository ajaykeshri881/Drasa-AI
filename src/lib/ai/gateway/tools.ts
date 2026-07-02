import { tool } from "ai";
import { z } from "zod";
import { GatewayRequest } from "./types";

export function getGatewayTools(req: GatewayRequest) {
  return {
    generate_website: tool({
      description: "Generate a fully functional, single-page website using HTML, Tailwind CSS (via CDN), and Vanilla JavaScript. Use this tool when the user asks you to build a website, UI component, or web app.",
      parameters: z.object({
        html: z.string().describe("The complete, raw HTML string including the <html>, <head>, and <body> tags."),
      }),
      execute: async ({ html }) => {
        if (req.userId) {
          try {
            const { User } = await import('../../db/models/User');
            const { connectDB } = await import('../../db/connection');
            const { getPlanLimits } = await import('../../config/plans');
            await connectDB();
            
            const user = await User.findById(req.userId);
            const limits = getPlanLimits(user?.plan || "free");
            
            if ((user?.usage?.websiteGenerationsUsed || 0) >= (limits as any).monthlyWebsites) {
              return { success: false, message: `Website generation limit reached. You have used all ${(limits as any).monthlyWebsites} generations for this month on the ${limits.name} plan. Please upgrade to generate more websites.` };
            }

            await User.findByIdAndUpdate(req.userId, {
              $inc: { 'usage.websiteGenerationsUsed': 1 }
            });
          } catch (e) {
            console.error("Failed to track website generation usage:", e);
          }
        }
        return { success: true, message: "Website generated successfully and displayed in the preview pane." };
      }
    }),
    internet_search: tool({
      description: "Search the internet for up-to-date information, news, or factual queries. Use this when you need current knowledge.",
      parameters: z.object({
        query: z.string().describe("The search query."),
      }),
      execute: async ({ query }) => {
        try {
          const { search } = await import('duck-duck-scrape');
          const results = await search(query);
          if (!results.results || results.results.length === 0) {
            return { success: false, message: "No results found." };
          }
          return {
            results: results.results.slice(0, 5).map((r: any) => ({
              title: r.title,
              snippet: r.description,
              url: r.url
            }))
          };
        } catch (error: any) {
          console.error("Search failed:", error);
          try {
            const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
            const data = await res.json();
            if (data.query?.search) {
              return {
                results: data.query.search.slice(0, 5).map((r: any) => ({
                  title: r.title,
                  snippet: r.snippet.replace(/<[^>]*>?/gm, ''),
                  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`
                }))
              };
            }
          } catch (e) {
            return { error: "Search failed. Please try again later or provide a more specific query." };
          }
          return { error: "Search failed. Please try again later or provide a more specific query." };
        }
      }
    }),
    store_memory: tool({
      description: "Save important personal information or preferences about the user to long-term memory. Use this whenever the user explicitly tells you something about themselves, their preferences, or asks you to remember something.",
      parameters: z.object({
        content: z.string().describe("The fact or preference to remember about the user."),
        category: z.string().describe("Category of the memory (e.g., 'preference', 'fact', 'contact')").optional()
      }),
      execute: async ({ content, category }) => {
        if (!req.userId) return { success: false, message: "User not authenticated." };
        try {
           const { Memory } = await import('../../db/models/Memory');
           const { connectDB } = await import('../../db/connection');
           const { upsertMemory } = await import('../memory/vector-store');
           const mongoose = (await import('mongoose')).default;
           await connectDB();
           
           const vectorId = `local_${Date.now()}`;
           const isObjectId = mongoose.Types.ObjectId.isValid(req.userId);
           const dbUserId = isObjectId ? new mongoose.Types.ObjectId(req.userId) : req.userId;
           
           await Memory.create({
             userId: dbUserId,
             content,
             category: category || 'fact',
             pineconeId: vectorId
           });
           try {
             await upsertMemory(req.userId, vectorId, content, category || 'fact');
           } catch (e) {
             console.error("ALERT: Failed to upsert to Pinecone vector store. Memory only saved to MongoDB:", e);
           }
           
           return { success: true, message: "Memory saved successfully." };
        } catch (e) {
           console.error("Failed to save memory tool (MongoDB error):", e);
           return { success: false, message: "Failed to save memory." };
        }
      }
    })
  };
}
