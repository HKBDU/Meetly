import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import meetlyLogo from "@/assets/meetly-logo.png"
import { useAuthParticipant } from "@/features/participants/hooks/useAuthParticipant"
import { loginSchema, type LoginFormValues } from "@/features/participants/schema"
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
} from "@/shared/components/ui"

interface ParticipantAuthFormProps {
  shortCode: string
}

/** Form định danh: username bắt buộc, password tuỳ chọn */
export function ParticipantAuthForm({ shortCode }: ParticipantAuthFormProps) {
  const navigate = useNavigate()
  const { access, isPending } = useAuthParticipant(shortCode)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  function handleSubmit(values: LoginFormValues) {
    access({
      username: values.username,
      password: values.password || undefined,
    })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border/80 shadow-lg shadow-green-900/5">
        <CardHeader className="items-center text-center">
          <img
            src={meetlyLogo}
            alt=""
            aria-hidden="true"
            className="mb-2 h-12 w-16 object-contain"
          />
          <CardTitle className="text-xl">Join the Event</CardTitle>
          <CardDescription>Enter your name to start filling in your availability</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)} noValidate>
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
                        <Input placeholder="e.g. Jane Doe" autoFocus className="pl-9" {...field} />
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
                          placeholder="Leave blank if not needed"
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
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isPending}
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button type="submit" size="lg" disabled={isPending}>
                  {isPending ? "Please wait..." : "Continue"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
