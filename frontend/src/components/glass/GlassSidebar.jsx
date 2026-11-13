import React from 'react';
import { motion } from 'framer-motion';

/**
 * GlassSidebar — MedsZop Glass Experience V3
 * Translucent glass navigation sidebar for dashboards, admin, and portal surfaces.
 */
export function GlassSidebar({
  header,
  items = [], // Array of { id, label, icon: Icon, href, active, onClick, badge }
  footer,
  className = '',
  collapsed = false,
  ...props
}) {
  return (
    <aside
      className={`h-full flex flex-col backdrop-blur-xl bg-white/75 dark:bg-slate-950/75 border-r border-slate-200/70 dark:border-slate-800/80 shadow-glass dark:shadow-glass-dark transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } ${className}`}
      {...props}
    >
      {/* Sidebar Header */}
      {header && (
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between">
          {header}
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <button
              key={item.id || item.label}
              type="button"
              onClick={item.onClick}
              className={`w-full relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group select-none ${
                isActive
                  ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-glow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
              }`}
            >
              {Icon && (
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-500'
                  }`}
                  aria-hidden="true"
                />
              )}

              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      {footer && (
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/40">
          {footer}
        </div>
      )}
    </aside>
  );
}

export default GlassSidebar;

