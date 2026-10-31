import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Unified button system (FR-frontend-button-system):
 * - `primary`: white fill, dark text, hover slightly darker
 * - `accent` + `tone`: colored fill, hover lighter (dark text, light text on the violet brand tone only)
 * - `secondary`: dark fill, light text, hover lighter
 * - utilities: `ghost`, `link`, `destructive`
 * Each hover has a `disabled:hover:` reset so a disabled button never reacts to the pointer.
 */
const buttonVariantsBase = cva(
  "inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 aria-invalid:border-destructive aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        primary: "border border-frame bg-white text-black hover:bg-gray-300 disabled:hover:bg-white",
        accent: "",
        secondary:
          "border border-input bg-gray-middle-light text-white hover:bg-gray disabled:hover:bg-gray-middle-light",
        destructive: "bg-destructive/60 text-white hover:bg-destructive/80 disabled:hover:bg-destructive/60",
        ghost: "hover:bg-white/10 hover:text-white disabled:hover:bg-transparent disabled:hover:text-inherit",
        link: "underline-offset-4 hover:text-primary-light hover:underline disabled:hover:text-inherit disabled:hover:no-underline",
      },
      tone: {
        violet: "",
        blue: "",
        red: "",
        pink: "",
        yellow: "",
        green: "",
      },
      size: {
        lg: "h-12 gap-3 rounded-[15px] px-6 text-lg has-[>svg]:px-5 [&_svg:not([class*='size-'])]:size-6",
        default: "h-9 px-4 text-sm has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 text-sm has-[>svg]:px-2.5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-12 rounded-[15px] [&_svg:not([class*='size-'])]:size-6",
      },
      align: {
        center: "justify-center text-center",
        start: "justify-start text-left",
      },
    },
    compoundVariants: [
      {
        variant: "accent",
        tone: "violet",
        class: "bg-primary text-primary-foreground hover:bg-primary-hover disabled:hover:bg-primary",
      },
      {
        variant: "accent",
        tone: "blue",
        class: "bg-blue text-black hover:bg-blue-hover disabled:hover:bg-blue",
      },
      {
        variant: "accent",
        tone: "red",
        class: "bg-red text-black hover:bg-red-hover disabled:hover:bg-red",
      },
      {
        variant: "accent",
        tone: "pink",
        class: "bg-pink text-black hover:bg-pink-hover disabled:hover:bg-pink",
      },
      {
        variant: "accent",
        tone: "yellow",
        class: "bg-yellow text-black hover:bg-yellow-hover disabled:hover:bg-yellow",
      },
      {
        variant: "accent",
        tone: "green",
        class: "bg-green text-black hover:bg-green-hover disabled:hover:bg-green",
      },
    ],
    defaultVariants: {
      variant: "accent",
      tone: "violet",
      size: "default",
      align: "center",
    },
  },
);

/** Merged classes, so a size radius (`lg`) or a consumer class always wins over the base one. */
const buttonVariants = (props?: Parameters<typeof buttonVariantsBase>[0]) => cn(buttonVariantsBase(props));

/**
 * Pressed state of an on/off filter toggle (`variant="secondary"` + `aria-pressed`):
 * neutral selection gray, never a violet fill (FR-frontend-button-system, design.md 5.1).
 */
const toggleButtonPressedClassName = "border-frame bg-white/15 font-semibold text-white hover:bg-white/15";

type ButtonVariantProps = VariantProps<typeof buttonVariantsBase>;
type ButtonTone = NonNullable<ButtonVariantProps["tone"]>;

function Button({
  className,
  variant = "accent",
  tone = "violet",
  size = "default",
  align = "center",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  ButtonVariantProps & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-tone={variant === "accent" ? tone : undefined}
      data-size={size}
      className={buttonVariants({ variant, tone, size, align, className })}
      {...props}
    />
  );
}

export { Button, buttonVariants, toggleButtonPressedClassName, type ButtonTone };
