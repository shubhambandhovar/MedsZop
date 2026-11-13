import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/**
 * GlassModal — MedsZop Glass Experience V3
 * Radix-based accessible modal with frosted translucent backdrop and card shell.
 */
export function GlassModal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className = '',
  maxWidth = 'max-w-lg',
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          className={`fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-0 rounded-3xl backdrop-blur-xl bg-white/92 dark:bg-slate-900/90 border border-white/80 dark:border-white/10 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] ${className}`}
        >
          {/* Header */}
          {(title || description) && (
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                {title && (
                  <DialogPrimitive.Title className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100">
                    {title}
                  </DialogPrimitive.Title>
                )}
                <DialogPrimitive.Close className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              </div>
              {description && (
                <DialogPrimitive.Description className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-b-3xl flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default GlassModal;

