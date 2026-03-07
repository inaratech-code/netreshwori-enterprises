import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-6 h-32">
                        <Skeleton className="h-4 w-24 rounded-md mb-4" />
                        <Skeleton className="h-8 w-16 rounded-md" />
                    </div>
                ))}
            </div>
            <Skeleton className="flex-1 min-h-[200px] rounded-2xl" />
        </div>
    );
}
