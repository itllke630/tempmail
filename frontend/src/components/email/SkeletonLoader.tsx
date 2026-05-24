export function SkeletonLoader() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/50 animate-pulse">
          <div className="w-4 h-4 mt-0.5 rounded bg-gray-200 dark:bg-zinc-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded bg-gray-200 dark:bg-zinc-700" />
            <div className="h-3 w-full rounded bg-gray-100 dark:bg-zinc-800" />
            <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-zinc-800" />
          </div>
          <div className="h-3 w-12 rounded bg-gray-100 dark:bg-zinc-800 shrink-0" />
        </div>
      ))}
    </div>
  );
}
