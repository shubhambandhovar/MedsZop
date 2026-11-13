import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

/**
 * GlassToast — MedsZop Glass Experience V3
 * Frosted translucent toast notification surface.
 */
export function GlassToast({
  type = 'success', // 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  onClose,
  className = '',
}) {
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-glow-sm',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-rose-500',
      border: 'border-rose-500/30',
      glow: 'shadow-xs',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      border: 'border-amber-500/30',
      glow: 'shadow-xs',
    },
    info: {
      icon: Info,
      iconColor: 'text-sky-500',
      border: 'border-sky-500/30',
      glow: 'shadow-xs',
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-3 p-4 rounded-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border shadow-2xl ${config.border} ${config.glow} ${className}`}
      role="alert"
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden="true" />

      <div className="flex-1 min-w-0 pr-1">
        {title && (
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h4>
        )}
        {message && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            {message}
          </p>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
}

export default GlassToast;

