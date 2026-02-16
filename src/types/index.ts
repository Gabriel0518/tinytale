// Drama Types
export interface Drama {
  _id: string;
  title: string;
  cover: string;
  description: string;
  categories: string[];
  actors: string[];
  rating: number;
  episodes?: Episode[];
  isCompleted: boolean;
  status?: 'draft' | 'published';
  viewCount?: number;
  year?: number;
  director?: string;
  totalEpisodes?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  isFeatured?: boolean;
  featuredPosition?: number;
  releaseDate?: string;
  country?: string;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Episode {
  _id: string;
  dramaId: string | Drama;
  title: string;
  episodeNumber: number;
  videoUrl: string;
  thumbnail: string;
  duration: number;
  isFree: boolean;
  unlockPrice: number;
  subtitleUrl?: string;
  subtitleLanguage?: string;
  videoQuality?: '480p' | '720p' | '1080p';
  previewUrl?: string;
  viewCount?: number;
}

// User Types
export interface User {
  _id: string;
  email: string;
  nickname: string;
  avatar?: string;
  coins?: number;
  role?: 'user' | 'admin';
  status?: 'active' | 'banned';
  vipStatus?: 'none' | 'active' | 'expired';
  vipExpireDate?: string;
  createdAt?: string;
}

// Category Types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  sortOrder?: number;
}

// Comment Types
export interface Comment {
  _id: string;
  userId: User;
  dramaId: string | Drama;
  episodeId?: string | Episode;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  likes?: number;
  createdAt?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message: string;
  };
}
