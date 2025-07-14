import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-md hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500/50 transform hover:scale-105 transition-transform",
        destructive:
          "bg-red-600 text-white shadow-md hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500/50 transform hover:scale-105 transition-transform",
        outline:
          "border-2 border-blue-600 bg-white text-blue-600 shadow-md hover:bg-blue-50 hover:border-blue-700 active:bg-blue-100 focus-visible:ring-blue-500/50 transform hover:scale-105 transition-transform",
        secondary:
          "bg-gray-100 text-gray-800 shadow-md hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-500/50 transform hover:scale-105 transition-transform",
        ghost:
          "text-blue-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transform hover:scale-105 transition-transform",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 active:text-blue-800",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-4 text-base",
        sm: "h-8 rounded-md gap-1.5 px-4 has-[>svg]:px-3 text-sm",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-lg font-semibold",
        icon: "size-10",
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
  variant,
  size,
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
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }