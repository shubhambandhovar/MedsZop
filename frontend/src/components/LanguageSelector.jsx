import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Search,
  Check,
  Languages,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  SUPPORTED_LANGUAGES,
  getLanguageMetadata
} from '../i18n/languages';
import { setAppLanguage } from '../i18n';

/**
 * MedsZop Indian Multilingual Selector
 * Supports all 22 scheduled Indian languages + English (23 total).
 * Includes script tags, native names, search filtering, regional groupings,
 * and RTL indication.
 */
export function LanguageSelector({ variant = 'navbar', className = '' }) {
  const { i18n, t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'core' | 'scheduled' | 'rtl'

  const currentLanguage = useMemo(() => {
    return getLanguageMetadata(i18n.language);
  }, [i18n.language]);

  const filteredLanguages = useMemo(() => {
    let list = SUPPORTED_LANGUAGES;

    // Filter by tab
    if (activeTab === 'core') {
      list = list.filter((l) => l.tier === 'core');
    } else if (activeTab === 'scheduled') {
      list = list.filter((l) => l.tier === 'scheduled');
    } else if (activeTab === 'rtl') {
      list = list.filter((l) => l.dir === 'rtl');
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((lang) => {
      return (
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q) ||
        lang.script.toLowerCase().includes(q) ||
        lang.region.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeTab]);

  const handleSelectLanguage = async (code) => {
    try {
      await setAppLanguage(code);
      setOpen(false);
    } catch (e) {
      console.error('Failed to change language:', e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'navbar' ? (
          <Button
            variant="outline"
            size="sm"
            className={`rounded-full h-9 px-3 gap-1.5 border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs transition-all ${className}`}
            data-testid="language-selector-trigger"
            aria-label={`Current language: ${currentLanguage.name} (${currentLanguage.nativeName}). Click to change language.`}
          >
            <Globe className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
            <span className="font-medium text-foreground truncate max-w-[85px] sm:max-w-[110px]">
              {currentLanguage.nativeName}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              {currentLanguage.code.split('-')[0]}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5 opacity-70" aria-hidden="true" />
          </Button>
        ) : variant === 'mobile' ? (
          <Button
            variant="outline"
            className={`w-full justify-between rounded-xl h-11 px-3.5 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold ${className}`}
            data-testid="mobile-language-selector-trigger"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <div className="text-left">
                <span className="text-foreground block">{currentLanguage.nativeName}</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {currentLanguage.name} ({currentLanguage.script})
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono">
              Change
            </Badge>
          </Button>
        ) : (
          <Button
            variant="secondary"
            className={`rounded-xl px-4 py-2 text-sm font-semibold gap-2 ${className}`}
          >
            <Languages className="h-4 w-4" />
            <span>
              {currentLanguage.nativeName} ({currentLanguage.name})
            </span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Pan-Indian Multilingual Experience</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold font-heading text-foreground">
            Select Your Preferred Language / भाषा चुनें
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Official support across all 22 scheduled Indian languages + English, with native typography and script support.
          </DialogDescription>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Search language, native script, or region (e.g. বাংলা, Tamil, Devanagari)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-950 text-sm border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
              data-testid="language-search-input"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', label: 'All (23)' },
              { id: 'core', label: 'Popular (13)' },
              { id: 'scheduled', label: 'Scheduled (10)' },
              { id: 'rtl', label: 'RTL Scripts (3)' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Scrollable Language Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[50vh] sm:max-h-[55vh]">
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-10">
              <Globe className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-semibold text-foreground">No matching languages found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Try searching by common script or English language name.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {filteredLanguages.map((lang) => {
                const isSelected =
                  currentLanguage.code.toLowerCase() === lang.code.toLowerCase() ||
                  currentLanguage.code.split('-')[0].toLowerCase() === lang.code.toLowerCase();

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    data-testid={`lang-option-${lang.code}`}
                    className={`flex items-start justify-between p-3 sm:p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary/30'
                        : 'border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-base sm:text-lg font-bold text-foreground leading-snug"
                          style={{ fontFamily: lang.fontFamily }}
                        >
                          {lang.nativeName}
                        </span>
                        {lang.dir === 'rtl' && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                          >
                            RTL
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-muted-foreground">{lang.name}</span>
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <span className="text-[10px] text-muted-foreground truncate">{lang.script}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/75 truncate mt-0.5">
                        {lang.region}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center pt-1">
                      {isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Active: <strong className="text-foreground">{currentLanguage.nativeName} ({currentLanguage.name})</strong></span>
          <span className="text-right">Text Direction: <strong>{currentLanguage.dir.toUpperCase()}</strong></span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LanguageSelector;

