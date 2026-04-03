/**
 * 增强型视频预取模块
 * 基于字节跳动 DeLoad 论文和短视频预加载最佳实践
 *
 * 核心优化：
 * 1. 多分片并发下载（5-10 个分片同时下载）
 * 2. 自适应缓冲深度（根据网络状况动态调整）
 * 3. 智能预加载队列（预测用户行为）
 */

import { episodesApi } from "@/lib/api";
import { resolvePlaybackSource } from "@/lib/playback";
import type { StreamPlaybackInfo } from "@/types";

// 配置常量
const CONCURRENT_SEGMENTS = 6;           // 并发下载分片数（提升至 6 以加快预加载）
const INITIAL_BUFFER_SECONDS = 5;        // 初始缓冲秒数（降低至 5 秒以加快起播）
const MAX_BUFFER_SECONDS = 20;           // 最大缓冲秒数（降低至 20 秒以减少内存占用）
const SEGMENT_DURATION_ESTIMATE = 2;     // HLS 分片时长估算（秒）
const MANIFEST_CACHE_TTL = 5 * 60 * 1000; // Manifest 缓存 5 分钟
const MAX_COMPLETED_SEGMENTS = 1000;     // 最多缓存 1000 个已完成分片
const MAX_MANIFEST_CACHE = 50;           // 最多缓存 50 个 manifest
interface SegmentPrefetchTask {
  url: string;
  index: number;
  priority: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

interface VideoPrefetchState {
  episodeId: string;
  manifestUrl: string;
  segments: SegmentPrefetchTask[];
  totalSegments: number;
  downloadedSegments: number;
  estimatedDuration: number;
}

// 全局预取状态管理
const prefetchStates = new Map<string, VideoPrefetchState>();
const downloadingSegments = new Set<string>();
const completedSegments = new Set<string>();
const manifestCache = new Map<string, { segments: string[]; timestamp: number }>(); // 带 TTL 的 manifest 缓存
const activeDownloads = new Map<string, AbortController>(); // 追踪活跃的下载任务

/**
 * LRU 缓存管理：限制 completedSegments 大小
 */
function addCompletedSegment(url: string) {
  completedSegments.add(url);
  if (completedSegments.size > MAX_COMPLETED_SEGMENTS) {
    // 删除最早添加的 20% 条目（LRU 近似）
    const toDelete = Math.floor(MAX_COMPLETED_SEGMENTS * 0.2);
    const iterator = completedSegments.values();
    for (let i = 0; i < toDelete; i++) {
      const value = iterator.next().value;
      if (value) completedSegments.delete(value);
    }
  }
}

/**
 * 清理过期的 manifest 缓存
 */
function cleanExpiredManifests() {
  const now = Date.now();
  const entries = Array.from(manifestCache.entries());
  for (const [url, entry] of entries) {
    if (now - entry.timestamp > MANIFEST_CACHE_TTL) {
      manifestCache.delete(url);
    }
  }
  // 如果仍然超过限制，删除最旧的
  if (manifestCache.size > MAX_MANIFEST_CACHE) {
    const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = manifestCache.size - MAX_MANIFEST_CACHE;
    for (let i = 0; i < toDelete; i++) {
      manifestCache.delete(sortedEntries[i][0]);
    }
  }
}

/**
 * 取消所有正在进行的下载（用于快速切换视频时）
 */
export function cancelAllActiveDownloads() {
  activeDownloads.forEach((controller) => controller.abort());
  activeDownloads.clear();
  downloadingSegments.clear();
}

/**
 * 解析 HLS manifest 获取所有分片 URL（带 TTL 缓存）
 */
async function parseHlsManifest(manifestUrl: string): Promise<string[]> {
  // 清理过期缓存
  cleanExpiredManifests();

  const cached = manifestCache.get(manifestUrl);
  if (cached && Date.now() - cached.timestamp < MANIFEST_CACHE_TTL) {
    return cached.segments;
  }

  try {
    const response = await fetch(manifestUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache',
    });

    if (!response.ok) return [];

    const manifestText = await response.text();
    const lines = manifestText.split('\n').map(line => line.trim()).filter(Boolean);

    // 检查是否是 master playlist（多码率）
    const isMasterPlaylist = lines.some(line => line.includes('#EXT-X-STREAM-INF'));

    if (isMasterPlaylist) {
      // 选择第一个变体流
      const variantIndex = lines.findIndex(line => line.startsWith('#EXT-X-STREAM-INF'));
      if (variantIndex >= 0 && variantIndex + 1 < lines.length) {
        const variantUrl = lines[variantIndex + 1];
        const absoluteVariantUrl = new URL(variantUrl, manifestUrl).toString();
        return parseHlsManifest(absoluteVariantUrl);
      }
    }

    // 解析 media playlist
    const segmentUrls: string[] = [];
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const absoluteUrl = new URL(line, manifestUrl).toString();
        segmentUrls.push(absoluteUrl);
      }
    }

    manifestCache.set(manifestUrl, { segments: segmentUrls, timestamp: Date.now() });
    return segmentUrls;
  } catch (error) {
    console.error('Failed to parse HLS manifest:', error);
    return [];
  }
}

/**
 * 并发下载多个分片
 * 使用滑动窗口模式，保持 CONCURRENT_SEGMENTS 个并发连接
 */
async function downloadSegmentsConcurrently(
  segments: string[],
  concurrency: number = CONCURRENT_SEGMENTS,
  taskId?: string,
): Promise<void> {
  const queue = [...segments];
  const active: Promise<void>[] = [];

  const downloadOne = async (url: string): Promise<void> => {
    if (completedSegments.has(url) || downloadingSegments.has(url)) return;
    downloadingSegments.add(url);

    const controller = new AbortController();
    const downloadId = `${taskId || 'default'}-${url}`;
    activeDownloads.set(downloadId, controller);

    try {
      await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'force-cache',
        signal: controller.signal,
      });
      addCompletedSegment(url);
    } catch (error: any) {
      // Ignore abort errors (expected when cancelling)
      if (error.name !== 'AbortError') {
        // Silent fail for other errors
      }
    } finally {
      downloadingSegments.delete(url);
      activeDownloads.delete(downloadId);
    }
  };

  while (queue.length > 0 || active.length > 0) {
    while (active.length < concurrency && queue.length > 0) {
      const url = queue.shift()!;
      const promise = downloadOne(url).then(() => {
        active.splice(active.indexOf(promise), 1);
      });
      active.push(promise);
    }
    if (active.length > 0) {
      await Promise.race(active);
    }
  }
}

/**
 * 自适应预取深度计算
 * 根据网络状况和内存压力动态调整预取分片数
 */
function calculateAdaptivePrefetchDepth(): number {
  if (typeof navigator === 'undefined') return INITIAL_BUFFER_SECONDS;

  // 检测内存压力（移动端优化）
  const memory = (performance as any).memory;
  if (memory) {
    const usedMemoryRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    // 如果内存使用超过 80%，减少预取深度
    if (usedMemoryRatio > 0.8) {
      return 3; // 极低预取，避免 OOM
    }
    if (usedMemoryRatio > 0.6) {
      return 5; // 低预取
    }
  }

  const connection = (navigator as any).connection;
  if (!connection) return INITIAL_BUFFER_SECONDS;

  const effectiveType = connection.effectiveType;
  const downlink = connection.downlink; // Mbps

  // 根据网络类型调整预取深度（更保守的策略）
  if (effectiveType === '4g' && downlink > 10) {
    return MAX_BUFFER_SECONDS; // 高速网络：预取 20 秒
  } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 2)) {
    return 15; // 中速网络：预取 15 秒
  } else if (effectiveType === '3g') {
    return 10; // 低速网络：预取 10 秒
  }
  return 5; // 极低速网络：预取 5 秒
}

/**
 * 深度预取视频分片
 * 核心优化：并发下载 + 自适应深度 + 可取消
 */
export async function deepPrefetchVideoSegments(
  playbackUrl: string | undefined | null,
  options?: {
    startSeconds?: number;
    bufferSeconds?: number;
    taskId?: string;
  },
): Promise<void> {
  if (!playbackUrl || typeof window === 'undefined') return;
  const startSeconds = Math.max(0, options?.startSeconds || 0);
  const bufferSeconds = Math.max(5, options?.bufferSeconds || calculateAdaptivePrefetchDepth());
  const segmentCount = Math.ceil(bufferSeconds / SEGMENT_DURATION_ESTIMATE);
  const startIndex = Math.max(0, Math.floor(startSeconds / SEGMENT_DURATION_ESTIMATE) - 1);
  const cacheKey = `deep:${playbackUrl}:${startIndex}:${segmentCount}`;
  if (completedSegments.has(cacheKey)) return;

  try {
    const segmentUrls = await parseHlsManifest(playbackUrl);
    if (segmentUrls.length === 0) return;

    const targetSegments = segmentUrls.slice(
      startIndex,
      Math.min(startIndex + segmentCount, segmentUrls.length),
    );

    await downloadSegmentsConcurrently(targetSegments, CONCURRENT_SEGMENTS, options?.taskId);
    completedSegments.add(cacheKey);
  } catch {
    // 静默失败
  }
}

/**
 * 视频预加载队列管理器
 * 优化策略：高优先级任务立即中断低优先级任务
 */
export class VideoPreloadQueue {
  private queue: Array<{
    episodeId: string;
    playbackUrl?: string;
    streamVideoId?: string;
    priority: number;
    token?: string | null;
  }> = [];
  private isProcessing = false;
  private abortController: AbortController | null = null;
  private currentPriority = Infinity;

  /**
   * 添加视频到预加载队列
   * priority: 0 = 最高优先级（当前视频的下一个）
   */
  enqueue(
    episodeId: string,
    playbackUrl?: string,
    streamVideoId?: string,
    priority: number = 1,
    token?: string | null,
  ) {
    // 去重
    const existing = this.queue.findIndex(item => item.episodeId === episodeId);
    if (existing >= 0) {
      this.queue[existing].priority = Math.min(this.queue[existing].priority, priority);
    } else {
      this.queue.push({ episodeId, playbackUrl, streamVideoId, priority, token });
    }

    // 按优先级排序
    this.queue.sort((a, b) => a.priority - b.priority);

    // 如果新任务优先级更高，中断当前任务并取消所有低优先级下载
    if (priority < this.currentPriority && this.isProcessing) {
      this.abortController?.abort();
      // Cancel background segment downloads from lower priority videos
      if (priority === 0) {
        cancelAllActiveDownloads();
      }
    }

    if (!this.isProcessing) {
      void this.processQueue();
    }
  }

  /**
   * 清空队列（用户快速滑动时重置）
   */
  clear() {
    this.queue = [];
    this.abortController?.abort();
    this.abortController = null;
    this.isProcessing = false;
    this.currentPriority = Infinity;
    // Cancel all background segment downloads from previous videos
    cancelAllActiveDownloads();
  }

  /**
   * 处理预加载队列
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.currentPriority = item.priority;
      this.abortController = new AbortController();

      try {
        let url = item.playbackUrl;
        if (!url && item.episodeId) {
          const streamInfo = await episodesApi.getStream(
            item.episodeId,
            item.token || undefined,
          );
          const data = (streamInfo as any)?.data ?? streamInfo;
          url = resolvePlaybackSource(data as StreamPlaybackInfo, (data as StreamPlaybackInfo)?.videoUrl);
        }

        // 后台预取分片，不阻塞队列继续处理下一个
        if (url) {
          void deepPrefetchVideoSegments(url, { taskId: item.episodeId });
        }
      } catch {
        // 静默失败，继续处理下一个
      }
    }

    this.isProcessing = false;
    this.currentPriority = Infinity;
  }
}

// 全局预加载队列实例
let globalPreloadQueue: VideoPreloadQueue | null = null;

export function getPreloadQueue(): VideoPreloadQueue {
  if (!globalPreloadQueue) {
    globalPreloadQueue = new VideoPreloadQueue();
  }
  return globalPreloadQueue;
}

/**
 * 清理过期的预取缓存
 */
export function cleanupPrefetchCache() {
  completedSegments.clear();
  downloadingSegments.clear();
  prefetchStates.clear();
  manifestCache.clear();
}
