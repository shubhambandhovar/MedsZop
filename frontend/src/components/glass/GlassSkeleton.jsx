import React from 'react';

/**
 * GlassSkeleton — MedsZop Glass Experience V3
 * Shimmering frosted skeleton placeholder for smooth loading states.
 */
export function GlassSkeleton({
  variant = 'text', // 'text' | 'card' | 'avatar' | 'button' | 'custom'
  className = '',
  width,
  height,
  ...props
}) {
  const variantStyles = {
    text: 'h-4 w-full rounded-lg',
    card: 'h-44 w-full rounded-2xl',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-11 w-28 rounded-xl',
    custom: '',
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`animate-pulse backdrop-blur-sm bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/30 dark:border-slate-700/30 ${
        variantStyles[variant] || variantStyles.text
      } ${className}`}
      {...props}
    />
  );
}

export default GlassSkeleton;

