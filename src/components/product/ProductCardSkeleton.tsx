import { Skeleton } from "@/components/ui/skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-full p-0">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
        <Skeleton className="h-4 w-1/2 rounded-md mb-4" />
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}
