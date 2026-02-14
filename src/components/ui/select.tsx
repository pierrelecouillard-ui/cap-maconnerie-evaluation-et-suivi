import * as React from "react";

interface Ctx {
  value?: string;
  onChange?: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}
const SelectCtx = React.createContext<Ctx | null>(null);

export const Select: React.FC<{
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
}> = ({ value, onValueChange, children }) => {
  const [val, setVal] = React.useState(value);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setVal(value), [value]);
  const onChange = (v: string) => {
    setVal(v);
    onValueChange?.(v);
    setOpen(false);
  };
  return <SelectCtx.Provider value={{ value: val, onChange, open, setOpen }}>{children}</SelectCtx.Provider>;
};

export const SelectTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", ...props }) => {
  const ctx = React.useContext(SelectCtx);
  return (
    <button
      type="button"
      onClick={() => ctx?.setOpen(!ctx.open)}
      className={`w-full border rounded-md px-3 py-2 text-left text-sm bg-white ${className}`}
      {...props}
    />
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const ctx = React.useContext(SelectCtx);
  return <span>{ctx?.value || placeholder || "Sélectionner"}</span>;
};

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => {
  const ctx = React.useContext(SelectCtx);
  if (!ctx?.open) return null;
  return (
    <div className={`mt-1 w-full border rounded-md bg-white shadow ${className}`} {...props} />
  );
};

export const SelectItem: React.FC<React.HTMLAttributes<HTMLDivElement> & { value: string }> = ({ className = "", value, children, ...props }) => {
  const ctx = React.useContext(SelectCtx);
  const active = ctx?.value === value;
  return (
    <div
      role="option"
      aria-selected={active}
      onClick={() => ctx?.onChange?.(value)}
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 ${active ? "bg-neutral-100" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};