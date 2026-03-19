import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Drama } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDramaBadge(drama: Drama): 'hot' | 'new' | null {
  if ((drama.viewCount || 0) > 2000000) return 'hot';
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  if (drama.createdAt && new Date(drama.createdAt).getTime() > thirtyDaysAgo) return 'new';
  return null;
}

export function resolveDramaMode(drama: Pick<Drama, 'dramaMode' | 'isCompleted'>): 'serial' | 'completed' {
  if (drama.dramaMode === 'serial' || drama.dramaMode === 'completed') {
    return drama.dramaMode;
  }
  return drama.isCompleted ? 'completed' : 'serial';
}

export function formatDuration(seconds: number): string {
  const normalizedSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(normalizedSeconds / 60);
  const s = normalizedSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function safeParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}
