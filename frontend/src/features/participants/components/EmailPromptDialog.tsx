import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Mail } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/axios"

import { mergeFreeSlotIdsIntoRanges, resolveFreeSlotIds } from "@/features/participants/gridUtils"
import { emailSchema, type EmailFormValues } from "@/features/participants/schema"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@/shared/components/ui"

/**
 * Hiện sau lần auto-save đầu tiên và mở lại được từ `ScheduleActionsBar`. BE không có
 * endpoint email riêng nên gửi lại lịch hiện tại kèm email (BE REPLACE nên không có tác dụng phụ).
 */
export function EmailPromptDialog() {
  const isOpen = useParticipantStore((s) => s.isEmailDialogOpen)
  const closeEmailDialog = useParticipantStore((s) => s.closeEmailDialog)
  const markEmailSubscribed = useParticipantStore((s) => s.markEmailSubscribed)

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  })

  const mutation = useMutation({
    mutationFn: (submittedEmail: string) => {
      const { selectedSlotIds, paintMode, scheduleConfig } = useParticipantStore.getState()
      if (!scheduleConfig) throw new Error("Schedule config not loaded")

      const freeSlotIds = resolveFreeSlotIds(selectedSlotIds, paintMode, scheduleConfig)
      const timeSlots = mergeFreeSlotIdsIntoRanges(freeSlotIds, scheduleConfig)
      return saveAvailability(scheduleConfig.shortCode, { timeSlots, email: submittedEmail })
    },
    onSuccess: () => {
      toast.success("You'll be notified by email")
      markEmailSubscribed()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to save, please try again"))
    },
  })

  function handleSubmit(values: EmailFormValues) {
    mutation.mutate(values.email, { onSuccess: () => form.reset() })
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeEmailDialog()
      }}
    >
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

        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(handleSubmit)} noValidate>
            <p className="text-sm font-medium text-foreground">Notify me about this Event</p>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs text-muted-foreground">Email address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoFocus
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
        </Form>
      </DialogContent>
    </Dialog>
  )
}
