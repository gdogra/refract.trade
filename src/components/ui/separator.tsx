import * as React from "react"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      className={`shrink-0 ${
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px"
      } bg-border ${className || ""}`}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }