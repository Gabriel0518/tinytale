"use client";

import { useEffect, useMemo, useState } from "react";
import { countriesApi } from "@/lib/api";
import { ALL_COUNTRIES, mapCountryCatalogToOptions, type CountryCatalogItem, type CountryOption } from "@/lib/countries";
import type { SupportedLocale } from "@/lib/i18n";

function buildFallbackOptions(): CountryOption[] {
  return ALL_COUNTRIES.map((country) => ({
    value: country,
    label: country,
    alpha2: "",
  }));
}

export function useCountryCatalog(locale: SupportedLocale) {
  const [items, setItems] = useState<CountryCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCountries() {
      try {
        const response = await countriesApi.getAll({ limit: 500 });
        if (!cancelled) {
          setItems(Array.isArray(response?.data?.items) ? response.data.items : []);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => {
    const mapped = mapCountryCatalogToOptions(items, locale);
    return mapped.length > 0 ? mapped : buildFallbackOptions();
  }, [items, locale]);

  return {
    loading,
    items,
    options,
  };
}
