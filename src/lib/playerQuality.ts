export type QualityValue = string;

export interface QualityMenuOption {
  value: QualityValue;
  label: string;
  disabled?: boolean;
  badge?: string;
}

const FALLBACK_QUALITY_OPTIONS = ['auto', '1080p', '720p', '480p'];

function normalizeQualityValue(value: string): QualityValue {
  const normalized = String(value || '').trim();
  if (!normalized) return 'auto';
  if (/^4k$/i.test(normalized)) return '4K';
  const match = normalized.match(/^(\d{3,4})p$/i);
  if (match) return `${Number(match[1])}p`;
  if (/^auto$/i.test(normalized)) return 'auto';
  return normalized;
}

function getQualityHeight(value: string): number {
  const normalized = normalizeQualityValue(value);
  if (normalized === '4K') return 2160;
  if (normalized === 'auto') return -1;
  const match = normalized.match(/^(\d{3,4})p$/i);
  return match ? Number(match[1]) : 0;
}

function formatQualityLabel(value: string): string {
  const normalized = normalizeQualityValue(value);
  if (normalized === 'auto') return 'Auto';
  if (normalized === '4K') return '4K';
  const match = normalized.match(/^(\d{3,4})p$/i);
  if (match) return `${Number(match[1])}P`;
  return normalized.toUpperCase();
}

export function getQualityMenuOptions(_isVip: boolean, availableOptions?: string[]): QualityMenuOption[] {
  const sourceValues = (availableOptions && availableOptions.length > 0 ? availableOptions : FALLBACK_QUALITY_OPTIONS)
    .map(normalizeQualityValue);
  const values = Array.from(new Set(sourceValues)).sort((a, b) => getQualityHeight(b) - getQualityHeight(a));

  return values.map((value) => ({
    value,
    label: formatQualityLabel(value),
  }));
}

export function resolveDefaultQuality(options: QualityMenuOption[]): QualityValue {
  const enabledOptions = options.filter((option) => !option.disabled);
  const manualOptions = enabledOptions.filter((option) => option.value !== 'auto');
  if (manualOptions.length > 0) {
    return [...manualOptions].sort((a, b) => getQualityHeight(b.value) - getQualityHeight(a.value))[0].value;
  }
  if (enabledOptions.length > 0) {
    return enabledOptions[0].value;
  }
  return 'auto';
}
