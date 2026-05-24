interface AdSlotProps {
  variant: "leaderboard" | "sidebar" | "infeed" | "skyscraper";
  className?: string;
}

const variantStyles: Record<AdSlotProps["variant"], { container: string; size: string; label: string }> = {
  leaderboard: {
    container: "max-w-4xl mx-auto",
    size: "min-h-[90px] md:min-h-[90px]",
    label: "728×90",
  },
  sidebar: {
    container: "",
    size: "min-h-[250px]",
    label: "300×250",
  },
  skyscraper: {
    container: "",
    size: "min-h-[600px]",
    label: "160×600",
  },
  infeed: {
    container: "",
    size: "min-h-[100px]",
    label: "Native Ad",
  },
};

export function AdSlot({ variant, className = "" }: AdSlotProps) {
  const style = variantStyles[variant];

  return (
    <div className={`${style.container} ${className}`}>
      <div
        className={`${style.size} w-full rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col items-center justify-center gap-1.5 transition-colors`}
      >
        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 select-none">
          Advertisement
        </span>
        <span className="text-[10px] text-zinc-300 dark:text-zinc-600 select-none">
          {style.label}
        </span>
      </div>
    </div>
  );
}
