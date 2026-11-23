import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { getMyParticipant, saveAvailability } from '@/shared/api/events'
import { t as translate, useT } from '@/shared/i18n'
import { eventQueryKey } from '@/shared/hooks'
import type { EventDetail } from '@/shared/types'
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
} from '@/shared/components/ui'
import { emailSchema, type EmailFormValues } from '@/features/participants/schema'
import { useParticipantStore } from '@/features/participants/store'

/**
 * Hiện sau lần auto-save đầu tiên và mở lại được từ thanh thao tác. BE không có endpoint
 * email riêng nên gửi lại lịch đang lưu trên server kèm email (BE REPLACE nên không đổi lịch).
 */
export function EmailPromptDialog({ shortCode }: { shortCode: string }) {
  const t = useT()
  const queryClient = useQueryClient()
  const isOpen = useParticipantStore((s) => s.isEmailDialogOpen)
  const closeEmailDialog = useParticipantStore((s) => s.closeEmailDialog)
  const markEmailSubscribed = useParticipantStore((s) => s.markEmailSubscribed)

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const event = queryClient.getQueryData<EventDetail>(eventQueryKey(shortCode))
      if (event && event.status !== 1) throw new Error(translate('email.finalizedAlready'))
      // Lấy lịch đã lưu trên server, không lấy bản đang tô dở (có thể chưa kịp auto-save)
      const me = await getMyParticipant(shortCode)
      return saveAvailability(shortCode, { email, timeSlots: me.timeSlots })
    },
    onSuccess: () => {
      toast.success(translate('email.subscribed'))
      markEmailSubscribed()
      form.reset()
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeEmailDialog()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{t('email.title')}</DialogTitle>
            <Badge variant="secondary" className="font-normal">
              {t('email.optional')}
            </Badge>
          </div>
          <DialogDescription>{t('email.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit((values) => mutation.mutate(values.email))} noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs text-muted-foreground">{t('email.address')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="you@example.com" autoComplete="email" autoFocus className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mobile xếp dọc: nút cao 44px dễ bấm; `flex-1` chỉ dùng khi nằm ngang, vì basis 0 làm nút xếp dọc bị bẹp */}
            <DialogFooter className="gap-2 pt-1 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 w-full sm:h-10 sm:w-auto sm:flex-1"
                onClick={closeEmailDialog}
                disabled={mutation.isPending}
              >
                {t('email.skip')}
              </Button>
              <Button type="submit" size="lg" className="h-11 w-full sm:h-10 sm:w-auto sm:flex-1" disabled={mutation.isPending}>
                {mutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
