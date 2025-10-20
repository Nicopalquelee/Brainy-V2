export interface Note {
  id: string | number;
  title: string;
  subject?: string;
  subjectColor?: string; // derived on client
  description?: string; // not in backend, optional
  rating: number;
  author?: string; // not in backend, optional
  downloadCount?: number; // not in backend, optional
  createdAt?: string; // not in backend, optional
  contentUrl?: string;
  visits?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}