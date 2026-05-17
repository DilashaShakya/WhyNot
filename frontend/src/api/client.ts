import axios, { type InternalAxiosRequestConfig } from 'axios'

/**
 * Dev: empty base URL so requests go to the Vite dev server, which proxies `/api` to Rails
 * (see vite.config.ts). Set VITE_API_URL to call the API directly (e.g. test CORS).
 * Production: set VITE_API_URL when building for a remote API.
 */
function resolveApiBaseURL(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()
  if (configured) return configured
  if (import.meta.env.DEV) return ''
  return 'http://127.0.0.1:3002'
}

const baseURL = resolveApiBaseURL()

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
})

let tokenGetter: () => string | null = () => null

export function configureApiAuth(getToken: () => string | null): void {
  tokenGetter = getToken
}

let onUnauthorized: () => void = () => {}

export function configureUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

function prepareRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const token = tokenGetter()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

function isAuthCredentialRequest(config: InternalAxiosRequestConfig | undefined): boolean {
  const url = config?.url ?? ''
  return url.includes('/auth/login') || url.includes('/auth/register')
}

api.interceptors.request.use(prepareRequest)

api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (!axios.isAxiosError(err) || err.response?.status !== 401) {
      return Promise.reject(err)
    }

    const config = err.config

    // Wrong email/password (or validation) returns 401 — do not clear an existing session or redirect.
    if (isAuthCredentialRequest(config)) {
      return Promise.reject(err)
    }

    onUnauthorized()
    return Promise.reject(err)
  },
)
