import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive min-h-[44px] min-w-[44px] touch-manipulation border",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-primary/20 hover:bg-[#253E8D] hover:border-[#253E8D]/60 hover:text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-destructive text-white border-destructive/20 hover:bg-[#253E8D] hover:border-[#253E8D]/60 hover:text-white focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 shadow-md hover:shadow-lg",
        outline:
          "border-2 bg-background shadow-sm hover:bg-[#253E8D]/10 hover:border-[#253E8D] hover:text-[#253E8D] dark:bg-input/30 dark:border-input dark:hover:bg-[#253E8D]/20 dark:hover:border-[#253E8D] dark:hover:text-[#253E8D] hover:shadow-md transition-all",
        secondary:
          "bg-secondary text-secondary-foreground border-secondary/20 hover:bg-[#253E8D] hover:border-[#253E8D]/60 hover:text-white shadow-sm hover:shadow-md",
        ghost:
          "border-transparent hover:bg-[#253E8D]/10 hover:text-[#253E8D] hover:border-[#253E8D]/20 dark:hover:bg-[#253E8D]/20 dark:hover:text-[#253E8D] transition-colors",
        link: "text-primary underline-offset-4 hover:underline hover:text-[#253E8D] border-0 min-h-0 min-w-0",
      },
      size: {
        default: "h-11 px-5 py-2.5 has-[>svg]:px-4 min-h-[44px]",
        sm: "h-10 rounded-md gap-1.5 px-4 has-[>svg]:px-3 min-h-[44px]",
        lg: "h-12 rounded-md px-8 py-3 has-[>svg]:px-6 min-h-[48px] text-base",
        icon: "size-11 min-h-[44px] min-w-[44px]",
        "icon-sm": "size-10 min-h-[44px] min-w-[44px]",
        "icon-lg": "size-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
