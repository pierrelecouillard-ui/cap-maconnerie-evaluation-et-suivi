import * as React from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0-100
}
export const Progress: React.FC<ProgressProps> = ({ className = "", value = 0, ...props }) => {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full bg-neutral-200 rounded ${className}`} {...props}>
      <div className="h-2 bg-neutral-900 rounded transition-all" style={{ width: `${v}%` }} />
    </div>
  );
};
Progress.displayName = "Progress";