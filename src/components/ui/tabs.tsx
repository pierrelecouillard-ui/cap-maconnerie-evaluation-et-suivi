import * as React from "react";

interface TabsContextType {
  value: string;
  setValue: (v: string) => void;
}
const TabsCtx = React.createContext<TabsContextType | null>(null);

export const Tabs: React.FC<{
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
}> = ({ value, onValueChange, children }) => {
  const [internal, setInternal] = React.useState(value || "");
  React.useEffect(() => { if (value !== undefined) setInternal(value); }, [value]);
  const setValue = (v: string) => { onValueChange ? onValueChange(v) : setInternal(v); };
  return <TabsCtx.Provider value={{ value: value ?? internal, setValue }}>{children}</TabsCtx.Provider>;
};

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
  <div className={`inline-grid gap-1 bg-neutral-100 p-1 rounded-md ${className}`} {...props} />
);

export const TabsTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; disabled?: boolean; }> =
  ({ className = "", value, disabled, ...props }) => {
    const ctx = React.useContext(TabsCtx);
    const active = ctx?.value === value;
    return (
      <button
        disabled={disabled}
        onClick={() => !disabled && ctx?.setValue(value)}
        className={`px-3 py-1.5 text-sm rounded ${active ? "bg-white shadow" : "opacity-80"} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        {...props}
      />
    );
  };

export const TabsContent: React.FC<React.HTMLAttributes<HTMLDivElement> & { value: string; }> =
  ({ className = "", value, ...props }) => {
    const ctx = React.useContext(TabsCtx);
    if (ctx?.value !== value) return null;
    return <div className={className} {...props} />;
  };