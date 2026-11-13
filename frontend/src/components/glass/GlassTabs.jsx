import React from 'react';
import { motion } from 'framer-motion';

/**
 * GlassTabs — MedsZop Glass Experience V3
 * Animated pill-style glass tabs with smooth Framer Motion active indicator.
 */
export function GlassTabs({
  tabs = [], // Array of { id, label, icon: Icon, count }
  activeTab,
  onTabChange,
  className = '',
  tabClassName = '',
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/80 shadow-xs overflow-x-auto no-scrollbar max-w-full ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 select-none whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 ${
              isActive
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            } ${tabClassName}`}
          >
            {isActive && (
              <motion.div
                layoutId="active-glass-tab-indicator"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-glow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default GlassTabs;

