import React from 'react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';

/**
 * GlassDropdown — MedsZop Glass Experience V3
 * Radix-based accessible dropdown menu with frosted glass elevation.
 */
export function GlassDropdown({
  trigger,
  items = [], // Array of { id, label, icon: Icon, onClick, destructive, separator, shortcut }
  align = 'end',
  className = '',
}) {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger>

      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align={align}
          sideOffset={8}
          className={`z-50 min-w-[200px] p-1.5 rounded-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/70 dark:border-white/10 shadow-2xl duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ${className}`}
        >
          {items.map((item, idx) => {
            if (item.separator) {
              return (
                <DropdownPrimitive.Separator
                  key={`sep-${idx}`}
                  className="my-1 h-px bg-slate-100 dark:bg-slate-800"
                />
              );
            }

            const Icon = item.icon;

            return (
              <DropdownPrimitive.Item
                key={item.id || item.label}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none transition-colors select-none ${
                  item.destructive
                    ? 'text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/40'
                    : 'text-slate-700 dark:text-slate-300 focus:bg-emerald-50 dark:focus:bg-slate-800 focus:text-emerald-700 dark:focus:text-emerald-400'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                <span className="flex-1 truncate">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                    {item.shortcut}
                  </span>
                )}
              </DropdownPrimitive.Item>
            );
          })}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

export default GlassDropdown;

