import type { SupportedLocale } from '@/lib/i18n';
import translationMap from '@/lib/ui-translations.generated.json';

type AutoLocale = 'ko' | 'fr';
type LocaleDictionary<T> = Record<string, T>;
type AnyFn = (...args: unknown[]) => unknown;

const AUTO_LOCALES = new Set<AutoLocale>(['ko', 'fr']);
const OBJECT_CACHE = new WeakMap<object, Partial<Record<AutoLocale, unknown>>>();
const FUNCTION_CACHE = new WeakMap<AnyFn, Partial<Record<AutoLocale, AnyFn>>>();
const TRANSLATION_OVERRIDES: Record<AutoLocale, Record<string, string>> = {
  ko: {
    Home: '홈',
    Browse: '둘러보기',
    Search: '검색',
    History: '기록',
    'Watch History': '시청 기록',
    Coins: '코인',
    Dashboard: '대시보드',
    Save: '저장',
    Back: '뒤로',
    Help: '도움말',
    Subscription: '구독',
    Register: '회원가입',
    Login: '로그인',
    Apply: '신청',
    Reports: '리포트',
    Continue: '계속',
    Confirm: '확인',
    Ranking: '랭킹',
    Rankings: '랭킹',
    Profile: '프로필',
    Settings: '설정',
    Favorites: '즐겨찾기',
    Notifications: '알림',
    Purchases: '구매 내역',
    Payments: '결제',
    Cancel: '취소',
    Delete: '삭제',
    Edit: '수정',
    Create: '생성',
    Update: '업데이트',
  },
  fr: {
    Home: 'Accueil',
    Browse: 'Parcourir',
    Search: 'Rechercher',
    History: 'Historique',
    'Watch History': 'Historique de visionnage',
    Coins: 'Pièces',
    Dashboard: 'Tableau de bord',
    Save: 'Enregistrer',
    Back: 'Retour',
    Help: 'Aide',
    Subscription: 'Abonnement',
    Register: "S'inscrire",
    Login: 'Connexion',
    Apply: 'Postuler',
    Reports: 'Rapports',
    Continue: 'Continuer',
    Confirm: 'Confirmer',
    Ranking: 'Classement',
    Rankings: 'Classements',
    Profile: 'Profil',
    Settings: 'Paramètres',
    Favorites: 'Favoris',
    Notifications: 'Notifications',
    Purchases: 'Achats',
    Payments: 'Paiements',
    Cancel: 'Annuler',
    Delete: 'Supprimer',
    Edit: 'Modifier',
    Create: 'Créer',
    Update: 'Mettre à jour',
  },
};

function isAutoLocale(locale: SupportedLocale): locale is AutoLocale {
  return AUTO_LOCALES.has(locale as AutoLocale);
}

function translateString(value: string, locale: AutoLocale): string {
  const override = TRANSLATION_OVERRIDES[locale][value];
  if (override) return override;

  const table = (translationMap as Record<AutoLocale, Record<string, string>>)[locale];
  if (!table) return value;
  return table[value] || value;
}

function wrapFunction<T extends AnyFn>(fn: T, locale: AutoLocale): T {
  const cached = FUNCTION_CACHE.get(fn)?.[locale];
  if (cached) return cached as T;

  const wrapper = ((...args: unknown[]) => {
    const markers = args.map((_, index) => `__ARG_${index}__`);
    if (markers.length > 0) {
      try {
        const templateResult = fn(...markers);
        if (typeof templateResult === 'string') {
          let translated = translateString(templateResult, locale);
          markers.forEach((marker, index) => {
            translated = translated.split(marker).join(String(args[index] ?? ''));
          });
          if (translated !== templateResult) return translated;
        }
      } catch {
        // ignore and fallback to translating runtime value
      }
    }

    const result = fn(...args);
    if (typeof result === 'string') {
      return translateString(result, locale);
    }
    return result;
  }) as T;

  const localeMap = FUNCTION_CACHE.get(fn) || {};
  localeMap[locale] = wrapper;
  FUNCTION_CACHE.set(fn, localeMap);
  return wrapper;
}

function deepTranslate<T>(value: T, locale: AutoLocale): T {
  if (typeof value === 'string') {
    return translateString(value, locale) as T;
  }

  if (typeof value === 'function') {
    return wrapFunction(value as AnyFn, locale) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepTranslate(item, locale)) as T;
  }

  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const cached = OBJECT_CACHE.get(source)?.[locale];
    if (cached) return cached as T;

    const translated: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(source)) {
      translated[key] = deepTranslate(entry, locale);
    }

    const localeMap = OBJECT_CACHE.get(source) || {};
    localeMap[locale] = translated;
    OBJECT_CACHE.set(source, localeMap);
    return translated as T;
  }

  return value;
}

export function resolveLocaleCopy<T>(
  dictionary: LocaleDictionary<T>,
  locale: SupportedLocale,
  fallbackLocale = 'en'
): T {
  const direct = dictionary[locale];
  if (direct !== undefined) return direct;

  const fallback = dictionary[fallbackLocale] ?? Object.values(dictionary)[0];
  if (fallback === undefined) {
    throw new Error('Locale dictionary is empty.');
  }

  if (!isAutoLocale(locale)) return fallback;
  return deepTranslate(fallback, locale);
}
