import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
};

const base =
  "inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none";
const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800",
  outline: "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50",
  ghost: "bg-transparent border-transparent hover:bg-neutral-100",
  secondary: "bg-neutral-100 text-neutral-900 border-neutral-200 hover:bg-neutral-200",
};
const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 py-1",
  md: "h-9 px-3 py-2",
  lg: "h-10 px-4 py-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";