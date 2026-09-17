import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-sm font-semibold transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-[1.5px] border-foreground bg-foreground text-background hover:bg-accent hover:border-accent",
        outline:
          "border-[1.5px] border-foreground bg-transparent text-foreground hover:border-accent hover:text-accent",
        secondary:
          "border-[1.5px] border-foreground bg-card text-foreground hover:bg-accent hover:border-accent hover:text-background",
        ghost:
          "border-[1.5px] border-transparent bg-transparent text-foreground hover:border-accent hover:text-accent",
        destructive:
          "border-[1.5px] border-accent bg-accent text-background hover:bg-foreground hover:border-foreground",
        link: "border-none text-accent underline underline-offset-4 hover:no-underline p-0",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8",
        icon: "size-9 rounded-full p-0",
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
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
