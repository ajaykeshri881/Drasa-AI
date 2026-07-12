import { DEFAULT_MODEL_CONFIGS } from "@/lib/ai/gemini-config/models";

export function handleAttachments(messages: any[], attachments: any[], modelId: string, provider: string) {
  let updatedModelId = modelId;
  let updatedProvider = provider;

  if (attachments.length > 0) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      lastMessage.experimental_attachments = attachments.map((att: any) => ({
        url: att.url,
        contentType: att.mimeType,
        name: att.name
      }));
    }
    
    // Auto-switch to a vision-capable model if the current model doesn't support vision.
    // Uses the centralized model config instead of hardcoded model IDs.
    const currentModelConfig = DEFAULT_MODEL_CONFIGS.find(m => m.modelId === modelId);
    if (!currentModelConfig?.visionSupport) {
      // Find the first available vision-capable model (prefer non-premium)
      const visionModel = DEFAULT_MODEL_CONFIGS.find(m => m.visionSupport && !m.isPremium)
        || DEFAULT_MODEL_CONFIGS.find(m => m.visionSupport);
      if (visionModel) {
        updatedModelId = visionModel.modelId;
        updatedProvider = visionModel.provider;
      }
    }
  }

  return { updatedModelId, updatedProvider };
}
