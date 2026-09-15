export const eventUi = {
  adminFieldset: 'm-0 grid gap-3.5 rounded-lg border border-[#eeeeee] bg-[#ffffff] p-4',
  adminGrid: 'grid grid-cols-2 gap-3 max-[640px]:grid-cols-1',
  adminLegend: 'px-1.5 text-sm font-semibold text-[#0b1c30]',
  adminOptional: 'ml-[5px] text-[10px] font-normal text-[#6c7a71]',
  brand: 'flex items-center gap-2.5 text-sm font-semibold',
  brandIcon: 'grid size-9 place-items-center rounded bg-emerald-500 text-white',
  button: 'h-12 min-w-[132px] rounded text-base font-semibold',
  calendar: 'rounded-lg bg-[#eff4ff] p-6 max-[640px]:-mx-2 max-[640px]:px-0 max-[640px]:py-4',
  calendarDay: 'p-0 text-center',
  calendarDayButton:
    'grid h-10 w-[100%] place-items-center rounded border-0 bg-transparent text-xs text-[#0b1c30]\n' +
    'hover:bg-[#d9f8e9] disabled:cursor-not-allowed max-[640px]:h-8 w-full',
  calendarDayDisabled: 'opacity-50 [&>button]:cursor-not-allowed [&>button]:text-[#bbcabf]',
  calendarDayOutside: 'text-[#bbcabf]',
  calendarDaySelected: '[&>button]:bg-[#00a854] [&>button]:text-white [&>button]:hover:bg-[#00a854]',
  calendarGrid: 'w-full border-separate border-spacing-1 pt-0',

  calendarMonth: 'relative w-full',
  calendarMonthCaption: 'mb-7 text-sm flex h-8 items-center justify-center text-center', 
  calendarNav: 'absolute inset-x-0 top-0 flex h-8 items-center justify-between',
    
  calendarMonths: 'w-full',
  calendarReset: 'mt-5 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#009b4d]',
  calendarRoot: 'w-full',
  calendarToolbarButton:
    'mx-20 grid size-8 place-items-center rounded border-0 bg-[#eff4ff] text-[#0b1c30]\n' +
    'disabled:cursor-not-allowed disabled:opacity-[.45]',
  calendarToolbarTitle: 'text-base',
  calendarWeekday: 'py-1 text-center text-xs font-semibold text-[#6c7a71]',
  closeButton: 'grid place-items-center border-0 bg-transparent text-[#6c7a71]',
  desktopDialog: 'overflow-visible rounded-2xl border border-[#bbcabf]/60 bg-white shadow-[0_1px_1px_rgba(0,0,0,.05)]',
  desktopScreen: 'min-h-screen bg-[#f8f9ff] max-[640px]:hidden',
  field: 'grid gap-2',
  fieldError: 'text-[11px] text-[#ba1a1a]',
  fieldHint: 'text-xs font-semibold text-[#009b4d]',
  form: 'p-[25px]',
  formContent: 'grid max-w-none gap-4 max-[640px]:gap-3',
  formFooter:
    'mt-2 flex justify-start gap-2.5 border-0 pt-2\n' +
    'max-[640px]:fixed max-[640px]:inset-x-0 max-[640px]:bottom-0 max-[640px]:z-[2]\n' +
    'max-[640px]:m-0 max-[640px]:justify-stretch max-[640px]:bg-[#009b4d] max-[640px]:px-4 max-[640px]:py-2.5',
  formFooterButton: 'max-[640px]:h-[38px] max-[640px]:min-w-0 max-[640px]:flex-1',
  input:
    'h-[32px] w-full rounded border border-[#6b7280] bg-[#ffffff] px-3 text-md text-[#0b1c30]\n' +
    'outline-0 focus:border-[#009b4d] focus:shadow-[0_0_0_2px_#009b4d26]',
  joinButton: 'h-10 rounded border border-[#bbcabf] bg-white px-[17px] text-md text-[#0b1c30]',
  label: 'text-sm font-semibold text-[#0b1c30]',
  managementCard: 'rounded-2xl border border-[#bbcabf]/60 bg-white p-5',
  managementDetail: 'flex justify-between border-b border-[#ffffff] pb-1',
  managementDetails: 'mb-7 grid gap-3',
  managementDt: 'text-[#6c7a71]',
  managementDd: 'm-0 font-semibold text-[#0b1c30]',
  managementLink: 'inline-flex items-center justify-center max-[640px]:mb-2.5 max-[640px]:w-full',
  managementEdit: 'mr-2.5 max-[640px]:mb-2.5 max-[640px]:mr-0 max-[640px]:w-full',
  managementScreen: 'min-h-screen bg-[#f8f9ff] font-[\'Plus_Jakarta_Sans\',system-ui,sans-serif] text-[#0b1c30]',
  managementSuccess: 'mb-6 mt-0 font-semibold text-[#00a854]',
  mobileForm: 'max-[640px]:px-6 max-[640px]:pb-24 max-[640px]:pt-1',
  mobileScreen: 'hidden max-[640px]:block max-[640px]:min-h-screen max-[640px]:bg-white',
  mobileTitle:
    'm-0 mb-8 hidden text-[36px] leading-[44px] tracking-[-0.72px] text-[#0b1c30]\n' +
    'max-[640px]:mx-6 max-[640px]:mb-5 max-[640px]:mt-7 max-[640px]:block\n' +
    'max-[640px]:text-[28px] max-[640px]:leading-9',
  page: 'mx-auto w-[min(calc(100%_-_40px),760px)] py-5 pb-5',
  pageTitle: 'm-0 mb-8 text-[36px] leading-[44px] tracking-[-0.72px] text-[#0b1c30]',
  primaryButton:
    'w-full justify-center border-0 bg-[#009b4d] text-white hover:bg-[#008240]\n' +
    'disabled:cursor-wait disabled:opacity-[.65] h-10 rounded text-base font-semibold\n' +
    'sm:w-auto sm:min-w-[150px]',
  reopenButton: 'm-[30px] rounded-lg border-0 bg-[#009b4d] px-[18px] py-3 font-bold text-white',

  requiredMark: 'text-[#ba1a1a]',

  secondaryButton:
    'w-full justify-center border border-gray-300 bg-transparent text-gray-700\n' +
    'h-10 rounded text-base font-semibold sm:w-auto sm:min-w-[132px]',
  screenHeader: 'flex h-16 items-center justify-between border-b border-[#edf1ed] bg-white px-6',
  shell: 'min-h-screen bg-[#f8f9ff] font-[\'Plus_Jakarta_Sans\',system-ui,sans-serif] text-[#0b1c30]',
  siteHeader: 'flex h-16 items-center justify-between border-b border-[#bbcabf] bg-white px-8',
  submitError: 'mt-[18px] text-[13px] text-[#ba1a1a]',
  timeRange: 'relative grid grid-cols-2 gap-[13px]',
  timeRangeError: 'absolute left-0 top-[calc(100%+4px)] max-[640px]:static',
  timeSelectContent: 'overflow-hidden max-h-[220px]',
  timeSelectItem: 'h-8',
  timeSelectTrigger:
    'h-[42px] w-full rounded border border-[#6b7280] bg-white px-3 text-sm text-[#0b1c30]\n' +
    'outline-0 focus:border-[#009b4d] focus:shadow-[0_0_0_2px_#009b4d26]',
  typeControl: 'm-0 flex h-[45px] w-full rounded-lg border border-[#ffffff] bg-[#f9fafbcc] p-[3px]',
  typeControlButton: 'min-w-0 flex-1 rounded-md border-0 bg-transparent text-sm text-[#6c7a71]',
  typeControlButtonActive: 'border border-[#009b4d] bg-[#ecfdf566] text-[#009b4d]',
  updateWarning: 'w-[min(100%,460px)] rounded-xl bg-white p-7 shadow-[0_20px_60px_rgba(11,28,48,.2)]',
  updateWarningActions: 'mt-6 flex justify-end gap-2.5',
  updateWarningBackdrop: 'fixed inset-0 z-10 grid place-items-center bg-[#0b1c3059] p-5',
  updateWarningDescription: 'm-0 text-[13px] leading-5 text-[#6c7a71]',
  updateWarningSecondary: 'inline-flex items-center justify-center border border-[#6b7280] bg-white text-[#0b1c30]',
  updateWarningTitle: 'mb-2.5 mt-0 text-xl text-[#0b1c30]',
  weekdayOption: 'aspect-square min-h-[30px] w-[100%] h-[70%] border border-[#6b7280] bg-[#ffffff] text-sm text-[#0b1c30]',
  weekdayOptionSelected: 'border-[#00a854] bg-[#00a854] text-white',
  weekdayOptions: 'grid grid-cols-7 gap-[1%] max-[640px]:gap-2',
}
