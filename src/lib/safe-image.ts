const INVALID_IMAGE_HOSTNAMES = new Set(["example.com", "www.example.com"]);

export function resolveSafeImageUrl(url?: string | null, fallback = "/placeholder-cover.svg") {
  if (!url) return fallback;
  if (url.startsWith("blob:")) return url;

  try {
    const parsed = new URL(url);
    if (INVALID_IMAGE_HOSTNAMES.has(parsed.hostname.toLowerCase())) {
      return fallback;
    }
    return url;
  } catch {
    return url;
  }
}

export function resolveOptionalSafeImageUrl(url?: string | null) {
  const resolved = resolveSafeImageUrl(url, "");
  return resolved || undefined;
}
