export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 animate-pulse">
      <div className="aspect-[4/5] bg-slate-200 dark:bg-dark-700 w-full" />
      <div className="p-5 flex flex-col flex-1">
        <div className="h-3 w-1/3 bg-slate-200 dark:bg-dark-700 rounded mb-4" />
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-dark-700 rounded mb-2" />
        <div className="h-4 w-1/2 bg-slate-200 dark:bg-dark-700 rounded mb-6" />
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-700">
          <div className="h-6 w-1/3 bg-slate-200 dark:bg-dark-700 rounded" />
          <div className="h-4 w-1/4 bg-slate-200 dark:bg-dark-700 rounded" />
        </div>
      </div>
    </div>
  );
}
