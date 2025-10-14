export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  image?: {
    data: string; // Data URL for the image
    mimeType: string;
  };
  suggestions?: string[];
  sources?: {
    uri: string;
    title: string;
  }[];
}
