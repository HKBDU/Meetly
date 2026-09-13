import { useState } from "react"
import type { FormEvent } from "react"
import { CalendarClock, FlaskConical, KeyRound, User } from "lucide-react"

import { useAuthParticipant } from "@/features/participants/hooks/useAuthParticipant"
import { loginSchema } from "@/features/participants/schema"
import type { ScheduleDateMode } from "@/features/participants/types"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/components/ui"

type FieldErrors = Partial<Record<"username" | "password", string>>

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
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [demoDateMode, setDemoDateMode] = useState<ScheduleDateMode>("SPECIFIC_DATES")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = loginSchema.safeParse({ username, password })
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (key === "username" || key === "password") fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    access({
      credentials: {
        username: result.data.username,
        password: result.data.password || undefined,
      },
      dateMode: demoDateMode,
    })
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border/80 shadow-lg shadow-green-900/5">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center bg-primary/10 text-primary">
            <CalendarClock className="size-6" />
          </div>
          <CardTitle className="text-xl">Join the Event</CardTitle>
          <CardDescription>Enter your name to start filling in your availability</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5 border border-border bg-muted/40 p-3">
              <Label
                htmlFor="username"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Display Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="e.g. Jane Doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-invalid={!!errors.username}
                  autoFocus
                  className="pl-9"
                />
              </div>
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username}</p>
              )}

              <Label
                htmlFor="password"
                className="pt-1 text-xs font-semibold uppercase text-muted-foreground"
              >
                Password (optional)
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Leave blank if not needed"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  className="pl-9"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

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
        </CardContent>
      </Card>
    </div>
  )
}
