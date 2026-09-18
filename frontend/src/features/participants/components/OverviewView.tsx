import { CalendarRange, FlaskConical, Lock } from "lucide-react"

import { useParticipantStore } from "@/features/participants/store"
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui"

interface OverviewMockupProps {
  /** Dev-only: mô phỏng BE bắn sự kiện SignalR "EventFinalized" để xem trọn luồng UI */
  onSimulateFinalize: () => void
}

/**
 * Màn Tổng quan - phần lịch cá nhân + trạng thái chốt lịch (thuộc scope của
 * feature này). Heatmap tổng của cả nhóm KHÔNG thuộc scope này - do phần
 * khác trong team đảm nhận, nên chỉ để 1 placeholder note, chờ merge code
 * thật vào thay vì tự dựng mock UI cho phần không phải của mình.
 */
export function OverviewMockup({ onSimulateFinalize }: OverviewMockupProps) {
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview Heatmap</CardTitle>
          <CardDescription>
            Not part of this feature - waiting on the team's implementation to be merged in.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Button size="lg" className="gap-2 px-8" onClick={() => setView("PERSONAL")}>
          <CalendarRange className="size-4" />
          My Schedule
        </Button>
        <p className="max-w-xs text-xs text-muted-foreground">
          Fill in your availability so it can be combined into the group heatmap
        </p>
      </div>

      {!isFinalized && (
        <Button
          variant="ghost"
          size="sm"
          className="mx-auto gap-1.5 text-muted-foreground"
          onClick={onSimulateFinalize}
        >
          <FlaskConical className="size-3.5" />
          Demo: simulate finalizing the event (SignalR)
        </Button>
      )}
    </div>
  )
}
