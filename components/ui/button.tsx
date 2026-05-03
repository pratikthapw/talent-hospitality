import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand-green text-ink hover:bg-brand-green-mid",
        outline:
          "dark:text-on-dark border border-hairline-strong bg-transparent text-ink hover:bg-surface dark:border-hairline-dark dark:hover:bg-brand-teal-deep",
        secondary:
          "dark:text-on-dark border border-hairline-strong bg-transparent text-ink hover:bg-surface dark:border-hairline-dark",
        "on-dark": "bg-brand-green text-ink hover:bg-brand-green-mid",
        "secondary-on-dark":
          "text-on-dark border border-hairline-dark bg-transparent hover:bg-brand-teal",
        ghost:
          "dark:text-on-dark rounded-md bg-transparent text-ink hover:bg-surface dark:hover:bg-brand-teal-deep",
        link: "bg-transparent p-0 text-brand-green-dark hover:underline dark:text-brand-green",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20",
      },
      size: {
        default: "h-11 px-[22px] py-[10px] text-[14px]",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        ghost: "px-[12px] py-[8px] text-[14px]",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

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
  );
}

export { Button, buttonVariants };
