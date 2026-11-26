import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { trackEvent } from '@/lib/analytics'
import { accessParticipant } from '@/shared/api/events'
import { t as translate, useT } from '@/shared/i18n'
import { loginSchema, type LoginFormValues } from '@/features/participants/schema'
import { useParticipantStore } from '@/features/participants/store'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/shared/components/ui'

/** Form định danh: username bắt buộc, password tuỳ chọn (bắt buộc với admin) */
export function ParticipantAuthForm({ shortCode }: { shortCode: string }) {
  const t = useT()
  const navigate = useNavigate()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: LoginFormValues) =>
      accessParticipant(shortCode, { username: values.username, password: values.password || undefined }),
    onSuccess: (result) => {
      useParticipantStore.getState().login({
        shortCode,
        participantId: result.participantId,
        username: result.username,
        isAdmin: result.isAdmin,
        accessToken: result.accessToken,
      })
      trackEvent('join_event', { new_participant: result.isNewParticipant, is_admin: result.isAdmin })
      toast.success(translate('auth.welcome', { name: result.username }))
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lift">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <img src="/meetly-logo.png" alt="" aria-hidden="true" className="h-8 w-10 object-contain" />
            <span className="text-xl font-bold tracking-tight">meetly</span>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">{t('auth.title')}</CardTitle>
          <CardDescription>{t('auth.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutate(values))} noValidate>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-normal text-muted-foreground">{t('common.yourName')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder={t('auth.namePlaceholder')} autoComplete="username" autoFocus className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-normal text-muted-foreground">
                      {t('common.password')} <span className="text-muted-foreground/70">{t('auth.optional')}</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder={t('auth.passwordPlaceholder')}
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" size="lg" disabled={isPending} onClick={() => navigate('/')}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" size="lg" disabled={isPending}>
                  {isPending ? t('auth.wait') : t('auth.continue')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
