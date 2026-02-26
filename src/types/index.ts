// Drama Types
export interface Drama {
  _id: string;
  title: string;
  cover: string;
  horizontalCover?: string;
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

export interface SubtitleTrack {
  language: string;    // e.g. 'en', 'zh', 'es'
  label: string;       // e.g. 'English', '中文', 'Español'
  src: string;         // VTT file URL
  regions?: string[];  // Available regions, e.g. ['US', 'CN', 'SG']
}

export interface StreamPlaybackInfo {
  videoUid: string;
  playbackUrl: string;        // HLS manifest URL
  signedToken?: string;       // Signed token for paid content
  thumbnailUrl?: string;
  duration?: number;
  subtitles: SubtitleTrack[];
}

export interface PlaybackProgress {
  episodeId: string;
  currentTime: number;
  duration: number;
  completed: boolean;
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
  streamVideoId?: string;      // Cloudflare Stream video UID
  previewSeconds?: number;     // Preview duration for paid episodes (seconds)
  subtitles?: SubtitleTrack[]; // Subtitle tracks
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
  iconColor?: string;
  type?: 'genres' | 'regions' | 'tags';
  countries?: string[];
  status?: 'Active' | 'Disabled';
  sortOrder?: number;
}

// Review Types
export interface Review {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  dramaId: string;
  rating: number; // 1-5
  content: string;
  likes?: number;
  createdAt?: string;
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
