"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-[#fffef9] rounded-xl border border-[#c8d0c6] shadow-sm select-none", className)}
      classNames={{
        today: "font-bold text-[#146b4a] underline",
        selected: "bg-[#0b3e2d] text-white rounded-md",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-lg border"
      captionLayout="dropdown"
    />
  )
}

export { Calendar }
