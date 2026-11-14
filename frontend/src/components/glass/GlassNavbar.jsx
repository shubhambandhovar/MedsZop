import React from 'react';

/**
 * GlassNavbar — MedsZop Glass Experience V3
 * A floating / sticky glass header shell with backdrop blur, subtle border highlight,
 * and responsive container alignment.
 */
export function GlassNavbar({
  children,
  className = '',
  isScrolled = false,
  sticky = true,
  ...props
}) {
  return (
    <header
      className={`w-full z-40 transition-all duration-300 ${
        sticky ? 'sticky top-0 sm:top-2.5' : 'relative'
      } px-3 sm:px-6 lg:px-8 ${className}`}
      {...props}
    >
      <div
        className={`max-w-[1720px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 rounded-2xl sm:rounded-3xl transition-all duration-300 ${
          isScrolled
            ? 'backdrop-blur-2xl bg-white/75 dark:bg-slate-900/75 border border-white/85 dark:border-white/15 shadow-glass-xl dark:shadow-glass-dark-xl py-2.5 sm:py-3'
            : 'backdrop-blur-xl bg-white/65 dark:bg-slate-900/65 border border-white/80 dark:border-white/12 shadow-glass dark:shadow-glass-dark py-3 sm:py-3.5 hover:border-emerald-500/30'
        }`}
      >
        {children}
      </div>
    </header>
  );
}

export default GlassNavbar;

