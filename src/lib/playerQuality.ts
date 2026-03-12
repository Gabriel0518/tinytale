export type QualityValue = '2K' | '1080p' | '720p';

export interface QualityMenuOption {
  value: QualityValue;
  label: string;
  disabled?: boolean;
  badge?: string;
}

const BASE_QUALITY_OPTIONS: QualityMenuOption[] = [
  { value: '2K', label: '2K' },
  { value: '1080p', label: '1080P' },
  { value: '720p', label: '720P' },
];

export function getQualityMenuOptions(isVip: boolean): QualityMenuOption[] {
  return BASE_QUALITY_OPTIONS.map((option) => {
    if (option.value !== '2K') return option;
    if (isVip) return option;
    return {
      ...option,
      disabled: true,
      badge: 'VIP',
    };
  });
}

export function resolveDefaultQuality(options: QualityMenuOption[]): QualityValue {
  const preferredOrder: QualityValue[] = ['1080p', '720p', '2K'];
  for (const value of preferredOrder) {
    const found = options.find((item) => item.value === value && !item.disabled);
    if (found) return found.value;
  }
  return '720p';
}
