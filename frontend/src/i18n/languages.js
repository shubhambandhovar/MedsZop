/**
 * MedsZop Pan-Indian Multilingual Platform Language Registry
 * Supports all 22 scheduled languages of the Eighth Schedule to the Constitution of India + English (23 total).
 * Strict adherence to native orthography, script variants, and text directionality (LTR / RTL).
 */

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    dir: 'ltr',
    region: 'Pan-India / International',
    tier: 'core',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    dir: 'ltr',
    region: 'North & Central India',
    tier: 'core',
    fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    dir: 'ltr',
    region: 'West Bengal & Tripura',
    tier: 'core',
    fontFamily: "'Noto Sans Bengali', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    dir: 'ltr',
    region: 'Tamil Nadu & Puducherry',
    tier: 'core',
    fontFamily: "'Noto Sans Tamil', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    dir: 'ltr',
    region: 'Andhra Pradesh & Telangana',
    tier: 'core',
    fontFamily: "'Noto Sans Telugu', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    dir: 'ltr',
    region: 'Maharashtra & Goa',
    tier: 'core',
    fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    dir: 'ltr',
    region: 'Gujarat, DNH & DD',
    tier: 'core',
    fontFamily: "'Noto Sans Gujarati', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    dir: 'ltr',
    region: 'Karnataka',
    tier: 'core',
    fontFamily: "'Noto Sans Kannada', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    dir: 'ltr',
    region: 'Kerala & Lakshadweep',
    tier: 'core',
    fontFamily: "'Noto Sans Malayalam', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia',
    dir: 'ltr',
    region: 'Odisha',
    tier: 'core',
    fontFamily: "'Noto Sans Odia', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'pa-Guru',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    dir: 'ltr',
    region: 'Punjab, Chandigarh & Delhi',
    tier: 'core',
    fontFamily: "'Noto Sans Gurmukhi', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Bengali-Assamese',
    dir: 'ltr',
    region: 'Assam',
    tier: 'core',
    fontFamily: "'Noto Sans Bengali', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'ur-Arab',
    name: 'Urdu',
    nativeName: 'اردو',
    script: 'Perso-Arabic',
    dir: 'rtl',
    region: 'Pan-India (RTL)',
    tier: 'core',
    fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif"
  },
  {
    code: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    script: 'Devanagari',
    dir: 'ltr',
    region: 'Classical / Pan-India',
    tier: 'scheduled',
    fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    script: 'Devanagari',
    dir: 'ltr',
    region: 'Sikkim & West Bengal',
    tier: 'scheduled',
    fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    script: 'Devanagari',
    dir: 'ltr',
    region: 'Bihar & Jharkhand',
    tier: 'scheduled',
    fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    script: 'Devanagari',
    dir: 'ltr',
    region: 'Goa, Maharashtra & Karnataka',
    tier: 'scheduled',
    fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'brx',
    name: 'Bodo',
    nativeName: 'बर’',
    script: 'Devanagari',
    dir: 'ltr',
    region: 'Assam (Bodoland)',
    tier: 'scheduled',
    fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'doi',
    name: 'Dogri',
    nativeName: 'डोगरी',
    script: 'Devanagari',
    dir: 'ltr',
    region: 'Jammu & Kashmir',
    tier: 'scheduled',
    fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'ks-Arab',
    name: 'Kashmiri',
    nativeName: 'کٲشُر',
    script: 'Perso-Arabic',
    dir: 'rtl',
    region: 'Jammu & Kashmir (RTL)',
    tier: 'scheduled',
    fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif"
  },
  {
    code: 'sd-Arab',
    name: 'Sindhi',
    nativeName: 'سنڌي',
    script: 'Perso-Arabic',
    dir: 'rtl',
    region: 'Pan-India (RTL)',
    tier: 'scheduled',
    fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif"
  },
  {
    code: 'mni-Mtei',
    name: 'Manipuri (Meitei)',
    nativeName: 'ꯃꯩꯇꯩꯂꯣꯟ',
    script: 'Meitei Mayek',
    dir: 'ltr',
    region: 'Manipur',
    tier: 'scheduled',
    fontFamily: "'Noto Sans Meetei Mayek', 'Plus Jakarta Sans', sans-serif"
  },
  {
    code: 'sat-Olck',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    script: 'Ol Chiki',
    dir: 'ltr',
    region: 'Jharkhand, Odisha & West Bengal',
    tier: 'scheduled',
    fontFamily: "'Noto Sans Ol Chiki', 'Plus Jakarta Sans', sans-serif"
  }
];

export const RTL_LANGUAGES = ['ur-Arab', 'ks-Arab', 'sd-Arab'];

export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_STORAGE_KEY = 'medszop_lng';

export const getLanguageMetadata = (code) => {
  if (!code) return SUPPORTED_LANGUAGES[0];
  const normalized = code.toLowerCase();
  return (
    SUPPORTED_LANGUAGES.find(
      (lang) => lang.code.toLowerCase() === normalized || lang.code.split('-')[0].toLowerCase() === normalized
    ) || SUPPORTED_LANGUAGES[0]
  );
};

