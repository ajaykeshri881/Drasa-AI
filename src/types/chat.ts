export interface Chat {
  id: string;
  title: string;
  isPinned: boolean;
  messages: any[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  url: string;
  mimeType: string;
  name: string;
  size?: number;
}
