/**
 * MedsZop Glass Experience V3 — Centralized Design System Tokens
 * Defines official standards for glass transparency, blur levels, border colors,
 * corner radii, shadows, spacing, and Framer Motion spring physics.
 */

export const glassTokens = {
  // Surface Opacities & Blur
  surfaces: {
    frosted: {
      light: 'bg-white/75 border-white/70 backdrop-blur-md shadow-glass',
      dark: 'dark:bg-slate-900/75 dark:border-white/10 dark:backdrop-blur-md dark:shadow-glass-dark',
    },
    elevated: {
      light: 'bg-white/88 border-white/90 backdrop-blur-lg shadow-glass-hover',
      dark: 'dark:bg-slate-900/85 dark:border-white/15 dark:backdrop-blur-lg dark:shadow-glass-dark-hover',
    },
    subtle: {
      light: 'bg-white/50 border-slate-200/50 backdrop-blur-sm',
      dark: 'dark:bg-slate-900/50 dark:border-slate-800/50 dark:backdrop-blur-sm',
    },
    opaque: {
      light: 'bg-white/98 border-slate-200/80 shadow-xs',
      dark: 'dark:bg-slate-900/98 dark:border-slate-800/80 dark:shadow-xs',
    },
  },

  // Color Palette Accents
  colors: {
    emerald: {
      DEFAULT: '#059669',
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      glow: 'rgba(16, 185, 129, 0.25)',
    },
    mint: {
      DEFAULT: '#10b981',
      soft: '#f0fdf9',
      vibrant: '#34d399',
    },
    navy: {
      base: '#070c17',
      surface: '#0b1329',
      border: 'rgba(255, 255, 255, 0.08)',
    },
    ivory: {
      soft: '#fbfcf9',
      highlight: '#ffffff',
    },
  },

  // Radii
  radii: {
    sm: 'rounded-lg',     // 8px
    md: 'rounded-xl',     // 12px
    lg: 'rounded-2xl',    // 16px
    xl: 'rounded-3xl',    // 24px
    full: 'rounded-full', // Pills & badges
  },

  // Motion physics
  motion: {
    spring: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
    gentle: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
    },
    hover: {
      scale: 1.015,
      y: -2,
      transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
    fadeSlideUp: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
    },
    staggerContainer: {
      animate: {
        transition: {
          staggerChildren: 0.05,
        },
      },
    },
  },
};

