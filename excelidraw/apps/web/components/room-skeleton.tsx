import { Skeleton } from "@repo/ui/components/ui/skeleton"

export function RoomSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[40px] w-full" />
      <Skeleton className="h-[40px] w-full" />
      <Skeleton className="h-[40px] w-full" />
    </div>
  )
}

