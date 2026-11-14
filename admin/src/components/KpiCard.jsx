import React from "react";
import { cn } from "@/lib/utils";

export default function KpiCard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendType = "neutral", // "up" | "down" | "neutral"
  accent = "cyan", // "cyan" | "emerald" | "amber" | "indigo" | "rose"
  className
}) {
  const accentStyles = {
    cyan: "border-cyan-500/20 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5",
    emerald: "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5",
    amber: "border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5",
    indigo: "border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5",
    rose: "border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5",
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border glass-surface p-5 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded",
                  trendType === "up" && "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
                  trendType === "down" && "text-rose-600 dark:text-rose-400 bg-rose-500/10",
                  trendType === "neutral" && "text-muted-foreground bg-muted"
                )}
              >
                {trend}
              </span>
            )}
          </div>
          {subtext && (
            <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
              accentStyles[accent] || accentStyles.cyan
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

