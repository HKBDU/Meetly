export const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" })
export const weekdayShortFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" })
export const monthDayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
export const monthDayYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})
