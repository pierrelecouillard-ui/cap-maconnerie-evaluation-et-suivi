// src/components/ui/dialog.tsx
import React from "react";
import ReactDOM from "react-dom";

type DialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};

export const Dialog: React.FC<DialogProps & { children?: React.ReactNode }> = ({ open, onOpenChange, children }) => {
  // controlled dialog wrapper — no trigger provided here
  if (!open) return null;
  return ReactDOM.createPortal(
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={() => onOpenChange && onOpenChange(false)}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>,
    document.body
  );
};

export const DialogContent: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`px-5 py-4 border-b ${className}`}>{children}</div>
);

export const DialogTitle: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

export const DialogDescription: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <p className={`text-sm text-neutral-600 ${className}`}>{children}</p>
);

export default Dialog;
