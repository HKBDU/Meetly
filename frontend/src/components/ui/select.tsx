import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption<T = string | number> {
  value: T
  label: string
  disabled?: boolean
}

export interface CustomSelectProps<T = string | number> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  icon?: React.ReactNode
  className?: string
  triggerClassName?: string
  menuClassName?: string
  compact?: boolean
  disabled?: boolean
  'aria-label'?: string
}

export function CustomSelect<T = string | number>({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  icon,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  compact = false,
  disabled = false,
  'aria-label': ariaLabel,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const selectedItemRef = React.useRef<HTMLButtonElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Scroll to selected item when opened
  React.useEffect(() => {
    if (isOpen && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [isOpen])

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${compact ? 'compact' : ''} ${className} ${isOpen ? 'is-open' : ''}`}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`custom-select-trigger ${compact ? 'compact' : ''} ${triggerClassName}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        {icon && <span className="custom-select-icon">{icon}</span>}
        <span className="custom-select-label">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={compact ? 13 : 15}
          className={`custom-select-chevron ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          className={`custom-select-menu ${compact ? 'compact' : ''} ${menuClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={opt.disabled}
                ref={isSelected ? selectedItemRef : undefined}
                className={`custom-select-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
              >
                <span className="custom-select-item-label">{opt.label}</span>
                {isSelected && (
                  <Check size={14} className="custom-select-check" strokeWidth={2.5} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
