import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './mocks/server'

// ─── MSW Server lifecycle ─────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── window.matchMedia (required by Ant Design responsive utilities) ──────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ─── Clipboard API (not implemented in jsdom) ─────────────────────────────────
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
})

// ─── window.confirm (not auto-implemented in jsdom) ───────────────────────────
// Default to true; individual tests can override with vi.spyOn(window, 'confirm')
vi.stubGlobal('confirm', vi.fn(() => true))

// ─── window.open ──────────────────────────────────────────────────────────────
vi.stubGlobal('open', vi.fn())

// ─── react-i18next mock ───────────────────────────────────────────────────────
// Returns the translation key so tests can assert on keys, not hard-coded strings
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (!params) return key
      return Object.entries(params).reduce(
        (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
        key,
      )
    },
    i18n: { language: 'en-US', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))
