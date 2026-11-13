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
        sticky ? 'sticky top-0' : 'relative'
      } ${
        isScrolled
          ? 'backdrop-blur-xl bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/70 dark:border-slate-800/80 shadow-glass dark:shadow-glass-dark py-2.5 sm:py-3'
          : 'backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/40 dark:border-slate-800/50 py-3 sm:py-3.5'
      } ${className}`}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {children}
      </div>
    </header>
  );
}

export default GlassNavbar;

