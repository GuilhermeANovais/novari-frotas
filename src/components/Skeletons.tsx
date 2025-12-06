import { Skeleton } from "./Skeleton";

export function VehicleCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-200 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-200 overflow-hidden h-[380px] flex flex-col">
      <Skeleton className="h-48 w-full rounded-none" />
      
      <div className="p-4 flex-grow space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        
        <div className="space-y-2 mt-4">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-200/50 p-3 border-t border-zinc-100 dark:border-zinc-200 flex justify-end gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function DriverCardSkeleton() {
  return (
    <div className="p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-zinc-300 h-[140px] flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-200">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-200 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-200 flex items-center justify-between h-[106px]">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-12" />
      </div>
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  );
}
