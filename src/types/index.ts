// Drama Types
export interface Drama {
  id: string;
  title: string;
  cover: string;
  description: string;
  categories: string[];
  actors: string[];
  rating: number;
  episodes: Episode[];
  isCompleted: boolean;
  createdAt: string;
}

export interface Episode {
  id: string;
  dramaId: string;
  title: string;
  episodeNumber: number;
  videoUrl: string;
  thumbnail: string;
  duration: number;
  isFree: boolean;
  unlockPrice: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  coins: number;
  createdAt: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}
