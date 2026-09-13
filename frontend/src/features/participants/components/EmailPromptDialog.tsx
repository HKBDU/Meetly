import { useState } from "react"
import type { FormEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { Mail } from "lucide-react"
import { toast } from "sonner"

import { mergeFreeSlotIdsIntoRanges, resolveFreeSlotIds } from "@/features/participants/gridUtils"
import { emailSchema } from "@/features/participants/schema"
import { saveAvailability } from "@/features/participants/services"
import { useParticipantStore } from "@/features/participants/store"
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/shared/components/ui"

/**
 * Popup chỉ hiện 1 LẦN DUY NHẤT, ngay sau lần auto-save đầu tiên thành công.
 * Trạng thái đóng/mở nằm trong store (isEmailDialogOpen) nên không cần
 * điều kiện phức tạp ở component này.
 *
 * BE KHÔNG có endpoint đăng ký email riêng - field `email` nằm CHUNG trong
 * request lưu lịch rảnh (`SetAvailabilityRequest.Email`, xem AvailabilityController
 * bên BE). Vì popup này hiện SAU khi lần lưu đầu tiên đã gửi đi rồi (lúc đó
 * chưa có email), nên lúc đăng ký phải GỬI LẠI request lưu lịch - với đúng
 * lịch hiện tại + email lần này. BE dùng REPLACE (ghi đè toàn bộ theo lần gửi
 * gần nhất) nên gửi lại y hệt lịch cũ + email không có tác dụng phụ.
 */
export function EmailPromptDialog() {
  const isOpen = useParticipantStore((s) => s.isEmailDialogOpen)
  const closeEmailDialog = useParticipantStore((s) => s.closeEmailDialog)
  const markEmailSubscribed = useParticipantStore((s) => s.markEmailSubscribed)

  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (submittedEmail: string) => {
      const { selectedSlotIds, paintMode, scheduleConfig } = useParticipantStore.getState()
      if (!scheduleConfig) throw new Error("Schedule config not loaded")

      const freeSlotIds = resolveFreeSlotIds(selectedSlotIds, paintMode, scheduleConfig)
      const timeSlots = mergeFreeSlotIdsIntoRanges(freeSlotIds, scheduleConfig)
      return saveAvailability(scheduleConfig.eventId, { timeSlots, email: submittedEmail })
    },
    onSuccess: () => {
      toast.success("You'll be notified by email")
      markEmailSubscribed()
    },
    onError: () => {
      toast.error("Failed to save, please try again")
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = emailSchema.safeParse({ email })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid email address")
      return
    }

    setError(null)
    mutation.mutate(result.data.email)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeEmailDialog()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Email Notifications</DialogTitle>
            <Badge variant="secondary" className="font-normal">
              Optional
            </Badge>
          </div>
          <DialogDescription>Get notified when the Host confirms the final event time.</DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Notify me about this Event</p>
            <Label htmlFor="notify-email" className="text-xs text-muted-foreground">
              Email address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="notify-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                autoFocus
                className="pl-9"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={closeEmailDialog}
              disabled={mutation.isPending}
            >
              Skip
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
