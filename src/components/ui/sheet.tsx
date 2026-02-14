import * as React from "react";

type Side = "left" | "right";

interface SheetContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
  side: Side;
}
const SheetCtx = React.createContext<SheetContextType | null>(null);

export const Sheet: React.FC<{
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: React.ReactNode;
}> = ({ open: controlledOpen, onOpenChange, children }) => {
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const open = controlledOpen ?? uncontrolled;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setUncontrolled(v);
  };
  return <SheetCtx.Provider value={{ open, setOpen, side: "left" }}>{children}</SheetCtx.Provider>;
};

export const SheetTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  const ctx = React.useContext(SheetCtx);
  if (!ctx) return <button {...props} />;
  return <button {...props} onClick={() => ctx.setOpen(true)} />;
};

export const SheetContent: React.FC<{
  side?: Side;
  className?: string;
  children: React.ReactNode;
}> = ({ side = "left", className = "", children }) => {
  const ctx = React.useContext(SheetCtx);
  if (!ctx) return null;
  const { open, setOpen } = ctx;
  if (!open) return null;
  const align = side === "left" ? "left-0" : "right-0";
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div className={`absolute inset-y-0 ${align} w-[360px] sm:w-[420px] bg-white border-r overflow-y-auto ${className}`}>
        {children}
      </div>
    </div>
  );
};

export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
  <div className={`px-4 py-3 border-b ${className}`} {...props} />
);
export const SheetTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
  <div className={`text-base font-semibold ${className}`} {...props} />
);