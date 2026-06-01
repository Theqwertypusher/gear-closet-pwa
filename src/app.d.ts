declare const __APP_VERSION__: string

interface Window {
  gtag: (...args: unknown[]) => void
  dataLayer: unknown[]
}
