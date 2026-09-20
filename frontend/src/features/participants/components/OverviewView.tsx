import { useQuery } from "@tanstack/react-query"

import { HeatmapPage } from "@/features/heatmap"
import { finalizeEvent, getEvent, updateEvent } from "@/features/heatmap/services"
import { findBestSlots } from "@/features/heatmap/suggestions"
import { useParticipantStore } from "@/features/participants/store"

interface OverviewViewProps {
  shortCode: string
}

export function OverviewView({ shortCode }: OverviewViewProps) {
  const auth = useParticipantStore((s) => s.auth)
  const setView = useParticipantStore((s) => s.setView)
  const accessToken = auth?.accessToken ?? ""

  const { data, isPending, error } = useQuery({
    queryKey: ["event", shortCode],
    queryFn: () => getEvent(shortCode),
    gcTime: 0,
    refetchOnMount: "always",
  })

  if (isPending || error || !data) {
    return (
      <HeatmapPage
        initialEvent={null}
        loading={isPending}
        loadError={error ? error.message : undefined}
      />
    )
  }

  return (
    <HeatmapPage
      initialEvent={data}
      accessToken={accessToken}
      isAdmin={auth?.isAdmin ?? false}
      onSuggestions={async (params, currentEvent) => findBestSlots(currentEvent, params)}
      onFinalize={(slot) => finalizeEvent(shortCode, slot, accessToken)}
      onUpdateEvent={(payload) => updateEvent(shortCode, payload, accessToken)}
      onOpenMySchedule={() => setView("PERSONAL")}
    />
  )
}
