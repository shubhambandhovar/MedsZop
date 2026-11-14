import React, { forwardRef } from 'react';

/**
 * GlassInput — MedsZop Glass Experience V3
 * Frosted translucent form input with WCAG 2.2 AA compliant contrast and emerald focus ring.
 */
export const GlassInput = forwardRef(function GlassInput(
  {
    label,
    error,
    helperText,
    icon: Icon,
    rightElement,
    className = '',
    inputClassName = '',
    id,
    disabled = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `glass-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide"
        >
          {label}
        </label>
      )}

      <div
        className={`relative flex items-center rounded-xl backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 border transition-all duration-200 ${
          error
            ? 'border-rose-500/80 focus-within:ring-2 focus-within:ring-rose-500/25'
            : 'border-slate-200/90 dark:border-slate-800/90 focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {Icon && (
          <div className="pl-3.5 pr-1 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none min-h-[44px] ${
            Icon ? 'pl-2' : ''
          } ${rightElement ? 'pr-10' : ''} ${inputClassName}`}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-2.5 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium pl-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 pl-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});

export default GlassInput;

