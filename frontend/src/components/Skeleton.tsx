export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-3xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-10 w-24" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface">
      <Skeleton className="h-44 rounded-none" />
      <div className="p-5">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="mt-2 h-4 w-2/3" />
        <Skeleton className="mt-4 h-7 w-1/2" />
        <Skeleton className="mt-3 h-3 w-2/5" />
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AlertCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-[18px]">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="mt-3 h-4 w-4/5" />
      <Skeleton className="mt-3 h-5 w-1/2" />
    </div>
  );
}
