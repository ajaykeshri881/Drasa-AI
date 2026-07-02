export interface Sponsor {
  title: string;
  description?: string;
  linkUrl?: string;
  linkText?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  supportsVision?: boolean;
}
