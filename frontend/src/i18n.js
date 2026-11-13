import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getLanguageMetadata
} from './i18n/languages';

// Synchronous default English fallback resources
import enCommon from './locales/en/common.json';
import enLanding from './locales/en/landing.json';
import enAuth from './locales/en/auth.json';
import enCatalog from './locales/en/catalog.json';
import enCheckout from './locales/en/checkout.json';
import enOrders from './locales/en/orders.json';
import enConsult from './locales/en/consult.json';
import enDashboard from './locales/en/dashboard.json';
import enSupport from './locales/en/support.json';

const ALL_NAMESPACES = [
  'common',
  'landing',
  'auth',
  'catalog',
  'checkout',
  'orders',
  'consult',
  'dashboard',
  'support'
];

// Dynamic lazy-loaders for all regional locales (code-split per language & namespace)
const localeLoaders = import.meta.glob('./locales/*/*.json');

/**
 * Lazy loads a specific language namespace if not already loaded into i18next
 */
export async function loadLocaleNamespace(lng, ns) {
  if (!lng || lng === 'en') return;
  if (i18n.hasResourceBundle(lng, ns)) return;

  const path = `./locales/${lng}/${ns}.json`;
  if (localeLoaders[path]) {
    try {
      const module = await localeLoaders[path]();
      const bundle = module.default || module;
      i18n.addResourceBundle(lng, ns, bundle, true, true);
    } catch (err) {
      console.warn(`[i18n] Failed to lazy load namespace '${ns}' for locale '${lng}':`, err);
    }
  }
}

/**
 * Lazy loads all namespaces for a given language
 */
export async function loadAllNamespacesForLanguage(lng) {
  if (!lng || lng === 'en') return;
  await Promise.all(ALL_NAMESPACES.map((ns) => loadLocaleNamespace(lng, ns)));
}

/**
 * High-level language change handler that:
 * 1. Lazy loads all required namespaces
 * 2. Switches i18next language
 * 3. Updates HTML <html lang="..." dir="..."> attributes
 * 4. Persists choice to localStorage
 */
export async function setAppLanguage(targetLanguage) {
  const meta = getLanguageMetadata(targetLanguage);
  const code = meta.code;

  if (code !== 'en') {
    await loadAllNamespacesForLanguage(code);
  }

  await i18n.changeLanguage(code);

  if (typeof document !== 'undefined') {
    document.documentElement.lang = code;
    document.documentElement.dir = meta.dir;
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  }

  return meta;
}

// Initial detected language from localStorage or detector
const savedLng = typeof localStorage !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
const initialLng = savedLng || DEFAULT_LANGUAGE;
const initialMeta = getLanguageMetadata(initialLng);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        landing: enLanding,
        auth: enAuth,
        catalog: enCatalog,
        checkout: enCheckout,
        orders: enOrders,
        consult: enConsult,
        dashboard: enDashboard,
        support: enSupport
      }
    },
    lng: initialLng,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    ns: ALL_NAMESPACES,
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage']
    },
    react: {
      useSuspense: false
    }
  });

// Set initial document attributes and preload initial non-English language if needed
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialMeta.code;
  document.documentElement.dir = initialMeta.dir;
}

if (initialLng !== 'en') {
  loadAllNamespacesForLanguage(initialLng).then(() => {
    i18n.changeLanguage(initialLng);
  });
}

// Global listener to keep document attributes synchronized
i18n.on('languageChanged', (lng) => {
  const meta = getLanguageMetadata(lng);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
  }
});

export default i18n;
