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
const CONCURRENT_SEGMENTS = 3;           // 并发下载分片数（平衡速度和资源）
const INITIAL_BUFFER_SECONDS = 10;       // 初始缓冲秒数
const MAX_BUFFER_SECONDS = 30;           // 最大缓冲秒数
const SEGMENT_DURATION_ESTIMATE = 2;     // HLS 分片时长估算（秒）
const PREFETCH_CACHE_TTL = 10 * 60 * 1000; // 预取缓存 10 分钟

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

/**
 * 解析 HLS manifest 获取所有分片 URL
 */
async function parseHlsManifest(manifestUrl: string): Promise<string[]> {
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
): Promise<void> {
  const queue = [...segments];
  const active: Promise<void>[] = [];

  const downloadOne = async (url: string): Promise<void> => {
    if (completedSegments.has(url) || downloadingSegments.has(url)) return;
    downloadingSegments.add(url);

    try {
      await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'force-cache',
        // 使用 AbortController 防止超时
        signal: AbortSignal.timeout(15000),
      });
      completedSegments.add(url);
    } catch {
      // 静默失败，不阻塞其他分片
    } finally {
      downloadingSegments.delete(url);
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
 * 根据网络状况动态调整预取分片数
 */
function calculateAdaptivePrefetchDepth(): number {
  if (typeof navigator === 'undefined') return INITIAL_BUFFER_SECONDS;

  const connection = (navigator as any).connection;
  if (!connection) return INITIAL_BUFFER_SECONDS;

  const effectiveType = connection.effectiveType;
  const downlink = connection.downlink; // Mbps

  // 根据网络类型调整预取深度（更保守的策略）
  if (effectiveType === '4g' && downlink > 10) {
    return MAX_BUFFER_SECONDS; // 高速网络：预取 30 秒
  } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 2)) {
    return 15; // 中速网络：预取 15 秒
  } else if (effectiveType === '3g') {
    return 10; // 低速网络：预取 10 秒
  }
  return 5; // 极低速网络：预取 5 秒
}

/**
 * 深度预取视频分片
 * 核心优化：并发下载 + 自适应深度
 */
export async function deepPrefetchVideoSegments(
  playbackUrl: string | undefined | null,
): Promise<void> {
  if (!playbackUrl || typeof window === 'undefined') return;
  const cacheKey = `deep:${playbackUrl}`;
  if (completedSegments.has(cacheKey)) return;

  try {
    const segmentUrls = await parseHlsManifest(playbackUrl);
    if (segmentUrls.length === 0) return;

    const bufferSeconds = calculateAdaptivePrefetchDepth();
    const segmentCount = Math.ceil(bufferSeconds / SEGMENT_DURATION_ESTIMATE);
    const targetSegments = segmentUrls.slice(0, Math.min(segmentCount, segmentUrls.length));

    await downloadSegmentsConcurrently(targetSegments, CONCURRENT_SEGMENTS);
    completedSegments.add(cacheKey);
  } catch {
    // 静默失败
  }
}

/**
 * 视频预加载队列管理器
 * 基于 DeLoad 论文的 Demand-Driven 策略
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
  }

  /**
   * 处理预加载队列
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.abortController = new AbortController();

      try {
        // 1. 预取流信息（如果没有 playbackUrl）
        let url = item.playbackUrl;
        if (!url && item.episodeId) {
          const streamInfo = await episodesApi.getStream(
            item.episodeId,
            item.token || undefined,
          );
          const data = (streamInfo as any)?.data ?? streamInfo;
          url = resolvePlaybackSource(data as StreamPlaybackInfo, (data as StreamPlaybackInfo)?.videoUrl);
        }

        // 2. 深度预取分片
        if (url) {
          await deepPrefetchVideoSegments(url);
        }
      } catch {
        // 静默失败，继续处理下一个
      }
    }

    this.isProcessing = false;
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
}
