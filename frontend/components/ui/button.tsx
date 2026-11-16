import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[#1d7874] focus-visible:ring-offset-2 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-[#ee2e31] aria-invalid:ring-2 aria-invalid:ring-[#ee2e31]/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#1d7874] text-white shadow-xs hover:bg-[#071e22]",
        outline:
          "border-[#679289]/50 bg-white text-[#071e22] hover:bg-[#679289]/15 hover:border-[#1d7874] dark:border-[#679289]/40 dark:bg-[#071e22] dark:text-white dark:hover:bg-[#1d7874]/30",
        secondary:
          "bg-[#f4c095]/35 text-[#071e22] border-[#f4c095] hover:bg-[#f4c095]/55",
        ghost:
          "text-[#071e22] hover:bg-[#679289]/15 dark:text-white dark:hover:bg-[#679289]/20",
        destructive:
          "bg-[#ee2e31] text-white shadow-xs hover:bg-[#ee2e31]/90 focus-visible:ring-[#ee2e31]",
        link: "text-[#1d7874] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-6 text-base",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
