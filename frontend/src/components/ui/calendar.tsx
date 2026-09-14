"use client"

import * as React from "react"
import { DayPicker, type DropdownProps } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"
import { CustomSelect } from "./select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function CalendarDropdown(props: DropdownProps) {
  const { options, value, onChange, disabled, "aria-label": ariaLabel } = props
  const selectOptions = (options || []).map((opt) => ({
    value: opt.value,
    label: opt.label,
    disabled: opt.disabled,
  }))

  return (
    <CustomSelect
      value={value as number}
      onChange={(newVal) => {
        onChange?.({
          target: { value: String(newVal) },
        } as React.ChangeEvent<HTMLSelectElement>)
      }}
      options={selectOptions}
      compact
      disabled={disabled}
      aria-label={ariaLabel}
      className="calendar-caption-select"
      triggerClassName="calendar-caption-trigger"
      menuClassName="calendar-caption-menu"
    />
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  startMonth,
  endMonth,
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear()
  const defaultStartMonth = new Date(currentYear, new Date().getMonth(), 1)
  const defaultEndMonth = new Date(currentYear + 10, 11, 31)

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      startMonth={startMonth ?? defaultStartMonth}
      endMonth={endMonth ?? defaultEndMonth}
      className={cn("p-3 bg-[#fffef9] rounded-xl border border-[#c8d0c6] shadow-sm select-none", className)}
      classNames={{
        today: "font-bold text-[#146b4a] underline",
        selected: "bg-[#0b3e2d] text-white rounded-md",
        ...classNames,
      }}
      components={{
        Dropdown: CalendarDropdown,
        ...components,
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
