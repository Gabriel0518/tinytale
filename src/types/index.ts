// Drama Types
export interface Drama {
  _id: string;
  creatorId?: string | null;
  creatorName?: string;
  creatorAvatar?: string;
  title: string;
  cover: string;
  horizontalCover?: string;
  description: string;
  categories: string[];
  actors: string[];
  rating: number;
  episodes?: Episode[];
  isCompleted: boolean;
  dramaMode?: 'serial' | 'completed';
  status?: 'draft' | 'published';
  viewCount?: number;
  year?: number;
  director?: string;
  totalEpisodes?: number;
  expectedTotal?: number | null;
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
  videoUrl?: string;            // Raw video URL (e.g. direct Cloudflare Stream HLS URL)
  playbackUrl?: string;       // HLS manifest URL (absolute, backward-compatible)
  playbackPath?: string;      // HLS manifest path (preferred)
  signedToken?: string;       // Signed token for paid content
  streamVideoId?: string;     // Cloudflare Stream video UID (alias for videoUid)
  subtitleUrl?: string | null;
  thumbnailUrl?: string;
  duration?: number;
  subtitles: SubtitleTrack[];
  qualityOptions?: string[];
  maxQuality?: string;
}

export interface VipBenefitPolicy {
  monthlyFreeDramaQuota: number;
  overLimitDiscountRate: number;
}

export interface VipBenefitUsage {
  monthKey: string;
  usedDramaCount: number;
  remainingDramaCount: number;
}

export interface VipBenefitPayload {
  mode: 'vip_monthly_free' | 'vip_discount' | string;
  policy?: VipBenefitPolicy;
  usage?: VipBenefitUsage | null;
}

export interface EpisodeAccessResult {
  hasAccess: boolean;
  reason?: string;
  unlockPrice?: number;
  originalUnlockPrice?: number;
  vipBenefit?: VipBenefitPayload | null;
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
  description?: string;
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
  id?: string;
  email: string;
  nickname: string;
  avatar?: string;
  coins?: number;
  silverCoins?: number;
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

export interface HomepageFeaturedBuckets {
  rankings?: Drama[];
  featured?: Drama[];
  trending?: Drama[];
  new?: Drama[];
}

export interface HomepagePlaylist {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  countries?: string[];
  resolvedLanguage?: string;
  requestedLanguage?: string;
  translationStatus?: string | null;
  dramas: Drama[];
}

export interface HomepageBanner {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  linkType: 'drama' | 'playlist' | 'url';
  linkId: string;
  slot: 'standard' | 'featured';
  position: number;
  status?: 'Active' | 'Disabled';
  resolvedLanguage?: string;
  requestedLanguage?: string;
  translationStatus?: string | null;
}

export interface HomepageHeroBanner {
  _id: string;
  coverImage: string;
  title: string;
  subtitle: string;
  tag: string;
  dramaId: string;
  displayDurationSec: number;
  position: number;
  resolvedLanguage?: string;
  requestedLanguage?: string;
  translationStatus?: string | null;
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

export interface FeedPlayableItem {
  itemId: string;
  dramaId: string;
  episodeId: string;
  chunkId: string;
  streamVideoId?: string;
  playbackUrl?: string;
  poster?: string;
  dramaTitle: string;
  episodeTitle: string;
  description?: string;
  durationMs: number;
  startMs: number;
  endMs: number;
  order: number;
  isFree: boolean;
  hasSubtitles: boolean;
  hasMultipleAudioTracks: boolean;
  preloadPriority: 'high' | 'medium' | 'low';
  seekable: boolean;
  chunkType: 'physical' | 'virtual';
}

export interface FeedWindowState {
  current: FeedPlayableItem;
  previous: FeedPlayableItem | null;
  next: FeedPlayableItem[];
  cursor: string | null;
  loadingStates: {
    current: 'loaded' | 'loading' | 'error';
    next: Array<'loaded' | 'loading' | 'error'>;
  };
  canSwitchNext: boolean;
  canSwitchPrev: boolean;
}

export interface FeedBootstrapPayload {
  mode: 'for-you' | 'following';
  window: FeedWindowState;
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

export interface IpGeoData {
  ip: string;
  countryCode: string | null;
  countryName: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  isPrivateIp: boolean;
  source: 'header' | 'provider' | 'private' | 'unknown';
  resolvedAt: string;
}
