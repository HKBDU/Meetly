import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import meetlyLogo from '@/assets/meetly-logo.png'
import { accessParticipant } from '@/shared/api/events'
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
      toast.success(`Welcome, ${result.username}!`)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <img src={meetlyLogo} alt="" aria-hidden="true" className="h-8 w-10 object-contain" />
            <span className="text-xl font-bold tracking-tight">meetly</span>
          </div>
          <CardTitle className="text-xl">Join the Event</CardTitle>
          <CardDescription>Enter your name to start filling in your availability</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutate(values))} noValidate>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                      Display Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="e.g. Jane Doe" autoComplete="username" autoFocus className="pl-9" {...field} />
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
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                      Password (optional)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Required if you set one before"
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
                  Cancel
                </Button>
                <Button type="submit" size="lg" disabled={isPending}>
                  {isPending ? 'Please wait…' : 'Continue'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
