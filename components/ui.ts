import type { Level } from "@/lib/levels";

const BUTTON_BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

const BUTTON_VARIANTS = {
  primary:
    "bg-indigo-700 text-white hover:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-slate-950",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-slate-100 dark:hover:bg-slate-800",
} as const;

export function buttonClass(variant: keyof typeof BUTTON_VARIANTS = "primary"): string {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]}`;
}

export const LEVEL_BADGE_CLASSES: Record<Level, string> = {
  iniciante: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100",
  intermediario: "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100",
  avancado: "bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100",
};

export const LINK_CLASS =
  "rounded font-medium text-indigo-700 underline underline-offset-4 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200";
