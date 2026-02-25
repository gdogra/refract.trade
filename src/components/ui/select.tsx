'use client'

import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

export interface SelectItemProps {
  children: React.ReactNode
  value: string
  className?: string
  disabled?: boolean
}

export interface SelectValueProps {
  placeholder?: string
  className?: string
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  placeholder?: string
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export const Select: React.FC<SelectProps> = ({ 
  children, 
  value, 
  onValueChange, 
  placeholder 
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value)
  
  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }
  
  React.useEffect(() => {
    setSelectedValue(value)
  }, [value])
  
  return (
    <SelectContext.Provider 
      value={{ 
        value: selectedValue, 
        onValueChange: handleValueChange, 
        isOpen, 
        setIsOpen, 
        placeholder 
      }}
    >
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, setIsOpen } = React.useContext(SelectContext)
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-blue-500 ring-offset-2",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className }) => {
  const { value, placeholder: contextPlaceholder } = React.useContext(SelectContext)
  
  return (
    <span className={cn("text-left truncate", className)}>
      {value || placeholder || contextPlaceholder || "Select..."}
    </span>
  )
}

export const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext)
  const contentRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen])
  
  if (!isOpen) return null
  
  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute top-full z-50 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      <div className="max-h-60 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export const SelectItem: React.FC<SelectItemProps> = ({ 
  children, 
  value, 
  className, 
  disabled = false 
}) => {
  const { value: selectedValue, onValueChange } = React.useContext(SelectContext)
  const isSelected = selectedValue === value
  
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-gray-100",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={() => !disabled && onValueChange?.(value)}
      data-disabled={disabled}
    >
      {isSelected && (
        <Check className="mr-2 h-4 w-4" />
      )}
      <span className={isSelected ? "ml-6" : "ml-0"}>
        {children}
      </span>
    </div>
  )
}

// Components are already exported above