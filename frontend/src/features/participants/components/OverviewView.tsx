import { CalendarRange, Lock } from "lucide-react"

import { useParticipantStore } from "@/features/participants/store"
import { Badge, Button } from "@/shared/components/ui"

export function OverviewView() {
  const auth = useParticipantStore((s) => s.auth)
  const config = useParticipantStore((s) => s.scheduleConfig)
  const isFinalized = useParticipantStore((s) => s.isFinalized)
  const setView = useParticipantStore((s) => s.setView)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {config?.eventName ?? "Meetly Event"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome, <span className="font-medium text-foreground">{auth?.username}</span>
          </p>
        </div>
        {isFinalized && (
          <Badge className="gap-1.5 bg-primary text-primary-foreground">
            <Lock className="size-3" />
            Finalized
          </Badge>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Button size="lg" className="gap-2 px-8" onClick={() => setView("PERSONAL")}>
          <CalendarRange className="size-4" />
          My Schedule
        </Button>
        <p className="max-w-xs text-xs text-muted-foreground">
          Fill in your availability so it can be combined into the group heatmap
        </p>
      </div>
    </div>
  )
}
