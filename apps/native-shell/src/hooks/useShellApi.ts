import { useMemo } from 'react';
import { createShellApi } from '../lib/api';
import { useI18n } from '../providers/I18nProvider';

export function useShellApi() {
  const { locale } = useI18n();
  return useMemo(() => createShellApi(locale), [locale]);
}
