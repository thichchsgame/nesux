import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  delta,
  index,
}: {
  label: string;
  value: string;
  delta?: string;
  index: string;
}) {
  const positive = delta?.startsWith("+");
  return (
    <div className="relative border border-border bg-foreground/[0.02] p-5">
      <span className="absolute right-4 top-4 text-[10px] tracking-[0.2em] text-muted-foreground/60">
        {index}
      </span>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-4 font-hand text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      {delta ? (
        <p
          className={`mt-2 text-[11px] uppercase tracking-[0.15em] ${positive ? "text-emerald-300" : "text-red-300"}`}
        >
          {delta} so với tháng trước
        </p>
      ) : null}
    </div>
  );
}

export function Panel({
  title,
  meta,
  children,
  className = "",
}: {
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border border-border bg-foreground/[0.02] ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[12px] uppercase tracking-[0.2em] text-foreground">
            {title}
          </h2>
          {meta ? (
            <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {meta}
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function BarChart({
  data,
  unit = "",
}: {
  data: { label: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-56 items-stretch gap-2 px-5 py-6">
      {data.map((d) => (
        <div
          key={d.label}
          className="group flex flex-1 flex-col items-center gap-2"
        >
          <span className="text-[9px] tracking-[0.1em] text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100">
            {unit}
            {d.value.toLocaleString("vi-VN")}
          </span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full bg-foreground/20 transition-colors group-hover:bg-foreground"
              style={{ height: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ProgressRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <span className="w-28 shrink-0 truncate text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <div className="h-2 flex-1 bg-foreground/[0.06]">
        <div
          className="h-full bg-foreground"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-hand text-[12px] text-foreground">
        {value}
      </span>
    </div>
  );
}

export function StatusPill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] ${className}`}
    >
      {children}
    </span>
  );
}

export function AdminButton({
  children,
  variant = "solid",
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  variant?: "solid" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "solid"
      ? "bg-primary text-primary-foreground hover:bg-primary/80"
      : "border border-border text-foreground hover:bg-foreground/[0.05]";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles}`}
    >
      {children}
    </button>
  );
}
