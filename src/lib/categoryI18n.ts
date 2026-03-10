import type { SupportedLocale } from '@/lib/i18n';

const CATEGORY_TRANSLATIONS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    all: 'All',
    romance: 'Romance',
    fantasy: 'Fantasy',
    drama: 'Drama',
    comedy: 'Comedy',
    action: 'Action',
    thriller: 'Thriller',
    mystery: 'Mystery',
    historical: 'Historical',
    scifi: 'Sci-Fi',
    horror: 'Horror',
    family: 'Family',
    youth: 'Youth',
    revenge: 'Revenge',
    urban: 'Urban',
    ceo: 'CEO',
    werewolf: 'Werewolf',
    suspense: 'Suspense',
  },
  zh: {
    all: '全部',
    romance: '爱情',
    fantasy: '奇幻',
    drama: '剧情',
    comedy: '喜剧',
    action: '动作',
    thriller: '惊悚',
    mystery: '悬疑',
    historical: '古装',
    scifi: '科幻',
    horror: '恐怖',
    family: '家庭',
    youth: '青春',
    revenge: '复仇',
    urban: '都市',
    ceo: '总裁',
    werewolf: '狼人',
    suspense: '悬念',
  },
  ja: {
    all: 'すべて',
    romance: '恋愛',
    fantasy: 'ファンタジー',
    drama: 'ドラマ',
    comedy: 'コメディ',
    action: 'アクション',
    thriller: 'スリラー',
    mystery: 'ミステリー',
    historical: '時代劇',
    scifi: 'SF',
    horror: 'ホラー',
    family: 'ファミリー',
    youth: '青春',
    revenge: '復讐',
    urban: '都会',
    ceo: 'CEO',
    werewolf: '人狼',
    suspense: 'サスペンス',
  },
  es: {
    all: 'Todo',
    romance: 'Romance',
    fantasy: 'Fantasía',
    drama: 'Drama',
    comedy: 'Comedia',
    action: 'Acción',
    thriller: 'Suspenso',
    mystery: 'Misterio',
    historical: 'Histórico',
    scifi: 'Ciencia ficción',
    horror: 'Terror',
    family: 'Familiar',
    youth: 'Juvenil',
    revenge: 'Venganza',
    urban: 'Urbano',
    ceo: 'CEO',
    werewolf: 'Hombre lobo',
    suspense: 'Suspenso',
  },
  pt: {
    all: 'Todos',
    romance: 'Romance',
    fantasy: 'Fantasia',
    drama: 'Drama',
    comedy: 'Comédia',
    action: 'Ação',
    thriller: 'Suspense',
    mystery: 'Mistério',
    historical: 'Histórico',
    scifi: 'Ficção científica',
    horror: 'Terror',
    family: 'Família',
    youth: 'Juventude',
    revenge: 'Vingança',
    urban: 'Urbano',
    ceo: 'CEO',
    werewolf: 'Lobisomem',
    suspense: 'Suspense',
  },
  hi: {
    all: 'सभी',
    romance: 'रोमांस',
    fantasy: 'फैंटेसी',
    drama: 'ड्रामा',
    comedy: 'कॉमेडी',
    action: 'एक्शन',
    thriller: 'थ्रिलर',
    mystery: 'रहस्य',
    historical: 'ऐतिहासिक',
    scifi: 'साइ-फाइ',
    horror: 'हॉरर',
    family: 'परिवार',
    youth: 'युवा',
    revenge: 'बदला',
    urban: 'शहरी',
    ceo: 'सीईओ',
    werewolf: 'वेयरवुल्फ',
    suspense: 'सस्पेंस',
  },
  id: {
    all: 'Semua',
    romance: 'Romansa',
    fantasy: 'Fantasi',
    drama: 'Drama',
    comedy: 'Komedi',
    action: 'Aksi',
    thriller: 'Thriller',
    mystery: 'Misteri',
    historical: 'Sejarah',
    scifi: 'Fiksi ilmiah',
    horror: 'Horor',
    family: 'Keluarga',
    youth: 'Remaja',
    revenge: 'Balas dendam',
    urban: 'Perkotaan',
    ceo: 'CEO',
    werewolf: 'Manusia serigala',
    suspense: 'Suspense',
  },
};

export function normalizeCategoryKey(input: string | undefined | null): string {
  if (!input) return '';
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/sci[-\\s]?fi/g, 'scifi')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned;
}

export function localizeCategoryLabel(
  name: string | undefined | null,
  locale: SupportedLocale,
  slug?: string | null
): string {
  if (!name) return '';
  const dict = CATEGORY_TRANSLATIONS[locale] || CATEGORY_TRANSLATIONS.en;
  const slugKey = normalizeCategoryKey(slug);
  const nameKey = normalizeCategoryKey(name);
  return dict[slugKey] || dict[nameKey] || name;
}
