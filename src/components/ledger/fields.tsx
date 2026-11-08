import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { parseNum } from "@/lib/ledger/money";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const controlClass =
  "h-11 w-full rounded-md border border-line bg-paper px-3 text-base text-ink";

export function CellNum({
  label,
  value,
  onChange,
  readOnly,
  bare,
}: {
  label: string;
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  bare?: boolean;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  return (
    <input
      aria-label={label}
      inputMode="decimal"
      readOnly={readOnly}
      value={text}
      onFocus={(event) => {
        setFocused(true);
        event.currentTarget.select();
      }}
      onBlur={() => {
        const next = parseNum(text);
        setFocused(false);
        setText(String(next));
        if (!readOnly) onChange?.(next);
      }}
      onChange={(event) => {
        const next = event.target.value.replace(/,/g, "");
        if (next !== "" && !/^\d*\.?\d{0,2}$/.test(next)) return;
        setText(next);
        if (!readOnly && next !== "" && !next.endsWith(".")) onChange?.(parseNum(next));
      }}
      className={cn(
        "w-full text-right tabular-nums text-ink outline-none",
        bare
          ? "h-11 bg-transparent px-2 text-base md:h-10 md:text-sm"
          : "h-11 rounded-md border border-line bg-paper px-3 text-base",
        readOnly && "text-muted",
      )}
    />
  );
}
