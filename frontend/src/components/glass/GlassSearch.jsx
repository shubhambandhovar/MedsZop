import React, { forwardRef, useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * GlassSearch — MedsZop Glass Experience V3
 * Frosted search component with shortcut badge and instant clear action.
 */
export const GlassSearch = forwardRef(function GlassSearch(
  {
    value,
    onChange,
    onClear,
    placeholder = 'Search medicines, salts, health articles...',
    className = '',
    inputClassName = '',
    showShortcut = true,
    autoFocus = false,
    ...props
  },
  ref
) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutKey = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <div
      className={`relative flex items-center w-full rounded-2xl backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-800/80 shadow-xs focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-200 ${className}`}
    >
      <div className="pl-4 pr-1 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
        <Search className="h-4 w-4" aria-hidden="true" />
      </div>

      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none min-h-[44px] ${inputClassName}`}
        {...props}
      />

      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mr-3 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Clear search input"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : showShortcut ? (
        <div className="mr-3 hidden sm:flex items-center">
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
            {shortcutKey}
          </kbd>
        </div>
      ) : null}
    </div>
  );
});

export default GlassSearch;

