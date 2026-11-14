import React, { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * GlassCard — MedsZop Glass Experience V3
 * A frosted translucent card component with WCAG 2.2 AA compliant contrast
 * and optional Framer Motion microinteractions respecting prefers-reduced-motion.
 */
export const GlassCard = forwardRef(function GlassCard(
  {
    children,
    variant = 'default', // 'default' | 'elevated' | 'subtle' | 'opaque'
    interactive = false,
    glow = false,
    className = '',
    animate = false,
    ...props
  },
  ref
) {
  const shouldReduceMotion = useReducedMotion();

  const variantStyles = {
    default:
      'backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border border-white/70 dark:border-white/10 shadow-glass dark:shadow-glass-dark',
    elevated:
      'backdrop-blur-lg bg-white/88 dark:bg-slate-900/85 border border-white/90 dark:border-white/15 shadow-glass-hover dark:shadow-glass-dark-hover',
    subtle:
      'backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50',
    opaque:
      'bg-white/98 dark:bg-slate-900/98 border border-slate-200/80 dark:border-slate-800/80 shadow-xs',
  };

  const interactiveStyles = interactive
    ? shouldReduceMotion
      ? 'cursor-pointer transition-colors duration-150 hover:border-emerald-500/35 dark:hover:border-emerald-400/30'
      : 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass-hover dark:hover:shadow-glass-dark-hover hover:border-emerald-500/35 dark:hover:border-emerald-400/30'
    : '';

  const glowStyles = glow
    ? 'ring-1 ring-emerald-500/20 dark:ring-emerald-400/25 shadow-emerald-glow-sm'
    : '';

  const baseClasses = `rounded-2xl text-card-foreground transition-colors ${variantStyles[variant] || variantStyles.default} ${interactiveStyles} ${glowStyles} ${className}`;

  if (animate) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
        transition={{ duration: shouldReduceMotion ? 0.1 : 0.25, ease: [0.16, 1, 0.3, 1] }}
        whileHover={interactive && !shouldReduceMotion ? { y: -2 } : undefined}
        whileTap={interactive && !shouldReduceMotion ? { scale: 0.99 } : undefined}
        className={baseClasses}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div ref={ref} className={baseClasses} {...props}>
      {children}
    </div>
  );
});

export default GlassCard;

