import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock, FlaskConical, KeyRound, User } from "lucide-react"
import { useForm } from "react-hook-form"

import { useAuthParticipant } from "@/features/participants/hooks/useAuthParticipant"
import { loginSchema, type LoginFormValues } from "@/features/participants/schema"
import type { ScheduleDateMode } from "@/features/participants/types"
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
  Label,
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/components/ui"

/**
 * Màn hình 1 - Định danh: Form nhập Username (bắt buộc) và Password (không bắt buộc).
 * Đăng nhập thành công -> lưu vào store -> ParticipantPage tự chuyển sang Overview.
 *
 * Kiểu lịch (SPECIFIC_DATES / DAYS_OF_WEEK) thực tế do BE trả về theo đúng
 * cấu hình event - participant không tự chọn được. Nhưng vì FE chưa có màn
 * "Tạo event" thật để tạo ra 1 event kiểu DAYS_OF_WEEK, nên toggle demo dưới
 * đây CHỈ để xem trước giao diện lưới ở cả 2 kiểu; xoá đi khi có API thật.
 */
export function ParticipantAuthForm() {
  const { access, isPending } = useAuthParticipant()
  const [demoDateMode, setDemoDateMode] = useState<ScheduleDateMode>("SPECIFIC_DATES")

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  function handleSubmit(values: LoginFormValues) {
    access({
      credentials: {
        username: values.username,
        password: values.password || undefined,
      },
      dateMode: demoDateMode,
    })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border/80 shadow-lg shadow-green-900/5">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center bg-primary/10 text-primary">
            <CalendarClock className="size-6" />
          </div>
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

              <div className="space-y-1.5 border border-dashed border-border p-2.5">
                <Label className="flex items-center gap-1.5 text-muted-foreground">
                  <FlaskConical className="size-3.5" />
                  Schedule type (demo)
                </Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  value={demoDateMode}
                  onValueChange={(value) => value && setDemoDateMode(value as ScheduleDateMode)}
                >
                  <ToggleGroupItem value="SPECIFIC_DATES" className="flex-1 text-xs">
                    Specific Dates
                  </ToggleGroupItem>
                  <ToggleGroupItem value="DAYS_OF_WEEK" className="flex-1 text-xs">
                    Days of the Week
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? "Please wait..." : "Continue"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
