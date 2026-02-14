import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({ className = "", variant = "default", ...props }) => {
  const base = "inline-flex items-center rounded-md text-xs px-2 py-0.5";
  const styles = {
    default: "bg-neutral-900 text-white",
    secondary: "bg-neutral-100 text-neutral-700",
    outline: "border border-neutral-300 text-neutral-700",
  } as const;
  return <span className={`${base} ${styles[variant]} ${className}`} {...props} />;
};
Badge.displayName = "Badge";