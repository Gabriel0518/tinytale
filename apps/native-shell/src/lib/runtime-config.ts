const DEFAULT_DEV_WEB_URL = 'http://localhost:7001'
const DEFAULT_DEV_API_URL = 'http://localhost:7002'
const DEFAULT_PROD_WEB_URL = 'https://tinytale.top'
const DEFAULT_PROD_API_URL = 'https://api.tinytale.top'

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, '')
}

function resolveRuntimeUrl(explicitValue: string | undefined, productionDefault: string, developmentDefault: string) {
  if (explicitValue?.trim()) {
    return normalizeUrl(explicitValue)
  }

  return import.meta.env.PROD ? productionDefault : developmentDefault
}

export function getNativeShellWebBaseUrl() {
  return resolveRuntimeUrl(import.meta.env.VITE_WEB_URL, DEFAULT_PROD_WEB_URL, DEFAULT_DEV_WEB_URL)
}

export function getNativeShellApiBaseUrl() {
  return resolveRuntimeUrl(import.meta.env.VITE_API_URL, DEFAULT_PROD_API_URL, DEFAULT_DEV_API_URL)
}
