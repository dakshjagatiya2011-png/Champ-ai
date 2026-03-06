
export interface UserProfile {
  name: string;
  email: string;
  initial: string;
  color: string;
  provider: 'google' | 'apple' | 'guest';
}

export type AuthStatus = 'search' | 'splash' | 'auth' | 'dashboard' | 'appstore';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'file' | 'video';
  timestamp: number;
  imageUrl?: string;
  videoUrl?: string;
  fileUrl?: string;
  mimeType?: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface Notebook {
  id: string;
  title: string;
  sources: Source[];
}

export interface Source {
  id: string;
  name: string;
  content: string;
}
