interface AdSlotProps {
  variant: "leaderboard" | "sidebar" | "infeed";
  className?: string;
}

const variantStyles: Record<AdSlotProps["variant"], { container: string; size: string }> = {
  leaderboard: {
    container: "max-w-7xl mx-auto",
    size: "min-h-[90px] md:min-h-[90px]",
  },
  sidebar: {
    container: "",
    size: "min-h-[250px]",
  },
  infeed: {
    container: "",
    size: "min-h-[100px]",
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
          {variant === "leaderboard" ? "728×90" : variant === "sidebar" ? "300×250" : "Native Ad"}
        </span>
      </div>
    </div>
  );
}
