const ITEMS = [
  "FW—26 SYSTEM",
  "UTILITY WEAR",
  "MADE FOR THE EVERYDAY",
  "NEXUS",
  "NEW IN",
];

export function Ticker() {
  const line = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden border-b border-border bg-foreground py-2 text-background">
      <div className="animate-marquee flex w-max">
        {line.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.2em]"
          >
            {item}
            <span aria-hidden className="mx-6 opacity-40">
              /
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
