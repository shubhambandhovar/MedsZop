import React, { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * GlassButton — MedsZop Glass Experience V3
 * Tactile glass button with micro-motion, emerald accents, and accessible touch targets
 * that respects prefers-reduced-motion.
 */
export const GlassButton = forwardRef(function GlassButton(
  {
    children,
    variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size = 'md',        // 'sm' | 'md' | 'lg' | 'icon'
    disabled = false,
    loading = false,
    className = '',
    onClick,
    type = 'button',
    ...props
  },
  ref
) {
  const shouldReduceMotion = useReducedMotion();
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-glow-sm hover:shadow-emerald-glow border border-emerald-400/30',
    secondary:
      'backdrop-blur-md bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-xs',
    outline:
      'backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-600/30 dark:border-emerald-500/30',
    ghost:
      'hover:bg-slate-100/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-rose-400/30 shadow-xs',
  };

  const sizeStyles = {
    sm: 'min-h-[44px] px-3.5 text-xs rounded-xl gap-1.5 sm:min-h-[36px] sm:h-9',
    md: 'h-11 px-5 text-sm rounded-xl gap-2 min-h-[44px]',
    lg: 'h-13 px-6 text-base rounded-2xl gap-2.5 min-h-[48px]',
    icon: 'h-11 w-11 p-0 rounded-xl min-h-[44px] min-w-[44px] sm:h-10 sm:w-10 sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center',
  };

  const disabledStyles = disabled || loading
    ? 'opacity-60 cursor-not-allowed pointer-events-none'
    : shouldReduceMotion
      ? 'cursor-pointer'
      : 'cursor-pointer active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:transform-none';

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      whileTap={!disabled && !loading && !shouldReduceMotion ? { scale: 0.985 } : undefined}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.1 }}
      className={`inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 select-none motion-reduce:transition-none motion-reduce:transform-none ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${disabledStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
});

export default GlassButton;

