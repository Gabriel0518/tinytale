// Unified country/region system for TinyTale
// All pages that need country selection should import from here.

import type { SupportedLocale } from "@/lib/i18n";

export interface CountryGroup {
  label: string;
  countries: string[];
}

export interface CountryCatalogItem {
  _id?: string;
  countryEn: string;
  countryCn: string;
  alpha2: string;
  alpha3: string;
  timezone: string;
  currencyCode: string;
  currencySymbol: string;
  currencyName: string;
  tier: number;
  enabled: boolean;
}

export interface CountryOption {
  value: string;
  label: string;
  alpha2: string;
}

const CHINESE_CHARACTER_REGEX = /[\u3400-\u9fff]/;
const localizedRegionNameCache = new Map<string, string>();

export const COUNTRY_GROUPS: CountryGroup[] = [
  { label: "North America", countries: ["United States", "Canada", "Mexico", "Guatemala", "Cuba", "Haiti", "Dominican Republic", "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panama", "Jamaica", "Trinidad and Tobago", "Bahamas", "Barbados", "Belize", "Antigua and Barbuda", "Dominica", "Grenada", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Puerto Rico"] },
  { label: "South America", countries: ["Brazil", "Argentina", "Colombia", "Peru", "Venezuela", "Chile", "Ecuador", "Bolivia", "Paraguay", "Uruguay", "Guyana", "Suriname"] },
  { label: "Western Europe", countries: ["United Kingdom", "France", "Germany", "Netherlands", "Belgium", "Luxembourg", "Switzerland", "Austria", "Ireland", "Monaco", "Liechtenstein"] },
  { label: "Southern Europe", countries: ["Spain", "Italy", "Portugal", "Greece", "Malta", "Cyprus", "Andorra", "San Marino", "Vatican City"] },
  { label: "Northern Europe", countries: ["Sweden", "Norway", "Denmark", "Finland", "Iceland", "Estonia", "Latvia", "Lithuania"] },
  { label: "Eastern Europe", countries: ["Poland", "Czech Republic", "Slovakia", "Hungary", "Romania", "Bulgaria", "Ukraine", "Belarus", "Moldova", "Serbia", "Croatia", "Bosnia and Herzegovina", "Slovenia", "Montenegro", "North Macedonia", "Albania", "Kosovo"] },
  { label: "Russia & Central Asia", countries: ["Russia", "Kazakhstan", "Uzbekistan", "Turkmenistan", "Kyrgyzstan", "Tajikistan", "Georgia", "Armenia", "Azerbaijan"] },
  { label: "East Asia", countries: ["China", "Japan", "South Korea", "North Korea", "Taiwan", "Mongolia", "Hong Kong", "Macau"] },
  { label: "Southeast Asia", countries: ["Thailand", "Vietnam", "Philippines", "Indonesia", "Malaysia", "Singapore", "Myanmar", "Cambodia", "Laos", "Brunei", "Timor-Leste"] },
  { label: "South Asia", countries: ["India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives", "Afghanistan"] },
  { label: "Middle East", countries: ["Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Oman", "Yemen", "Iraq", "Iran", "Jordan", "Lebanon", "Syria", "Israel", "Palestine", "Turkey"] },
  { label: "North Africa", countries: ["Egypt", "Libya", "Tunisia", "Algeria", "Morocco", "Sudan", "South Sudan"] },
  { label: "West Africa", countries: ["Nigeria", "Ghana", "Senegal", "Ivory Coast", "Mali", "Burkina Faso", "Niger", "Guinea", "Guinea-Bissau", "Sierra Leone", "Liberia", "Togo", "Benin", "Gambia", "Cape Verde", "Mauritania"] },
  { label: "East Africa", countries: ["Kenya", "Ethiopia", "Tanzania", "Uganda", "Rwanda", "Burundi", "Somalia", "Eritrea", "Djibouti", "Madagascar", "Mauritius", "Seychelles", "Comoros"] },
  { label: "Central Africa", countries: ["Democratic Republic of Congo", "Republic of Congo", "Cameroon", "Central African Republic", "Chad", "Gabon", "Equatorial Guinea", "São Tomé and Príncipe"] },
  { label: "Southern Africa", countries: ["South Africa", "Namibia", "Botswana", "Zimbabwe", "Zambia", "Mozambique", "Angola", "Malawi", "Lesotho", "Eswatini"] },
  { label: "Oceania", countries: ["Australia", "New Zealand", "Papua New Guinea", "Fiji", "Samoa", "Tonga", "Vanuatu", "Solomon Islands", "Micronesia", "Palau", "Marshall Islands", "Kiribati", "Nauru", "Tuvalu", "Guam"] },
];

export const ALL_COUNTRIES: string[] = COUNTRY_GROUPS.flatMap(g => g.countries);

function containsChineseCharacters(value: string): boolean {
  return CHINESE_CHARACTER_REGEX.test(value);
}

function getLocalizedRegionName(alpha2: string, locale: SupportedLocale): string {
  const code = alpha2.trim().toUpperCase();
  if (!code || locale !== "zh") return "";

  const cacheKey = `${locale}:${code}`;
  const cached = localizedRegionNameCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let next = "";

  try {
    if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
      const displayNames = new Intl.DisplayNames(["zh-Hans-CN", "zh-Hans", "zh"], { type: "region" });
      const localized = displayNames.of(code);
      if (localized && localized.toUpperCase() !== code) {
        next = localized;
      }
    }
  } catch {
    next = "";
  }

  localizedRegionNameCache.set(cacheKey, next);
  return next;
}

export function getCountryDisplayName(country: Pick<CountryCatalogItem, "countryEn" | "countryCn" | "alpha2">, locale: SupportedLocale): string {
  const englishName = country.countryEn.trim();
  const chineseName = country.countryCn.trim();

  if (locale === "zh") {
    if (chineseName && containsChineseCharacters(chineseName)) {
      return chineseName;
    }

    const localizedName = getLocalizedRegionName(country.alpha2, locale);
    if (localizedName) {
      return localizedName;
    }

    if (chineseName) {
      return chineseName;
    }
  }

  return englishName;
}

export function mapCountryCatalogToOptions(items: CountryCatalogItem[], locale: SupportedLocale): CountryOption[] {
  return items
    .filter((item) => item.enabled !== false && item.countryEn.trim())
    .map((item) => ({
      value: item.countryEn.trim(),
      label: getCountryDisplayName(item, locale),
      alpha2: item.alpha2.trim().toUpperCase(),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, locale === "zh" ? "zh-Hans" : "en"));
}
