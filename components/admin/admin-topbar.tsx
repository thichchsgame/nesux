import type { ReactNode } from "react";

export function AdminTopbar({
  title,
  crumb,
  action,
}: {
  title: string;
  crumb: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
          Admin / {crumb}
        </p>
        <h1 className="mt-2 font-hand text-4xl font-bold uppercase tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}
