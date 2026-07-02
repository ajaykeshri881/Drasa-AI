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
    
    // Auto-switch model if attachments exist and current model likely doesn't support vision
    if (!modelId?.includes('vision') && !modelId?.includes('gemini') && !modelId?.includes('gpt-4') && !modelId?.includes('claude-3') && !modelId?.includes('pixtral')) {
      updatedModelId = "gemini-3.5-flash";
      updatedProvider = "gemini";
    }
  }

  return { updatedModelId, updatedProvider };
}
