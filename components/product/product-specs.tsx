type ProductSpecsProps = {
  categorySlug: string;
  attributes: Record<string, unknown> | null;
};

export function ProductSpecs({ categorySlug, attributes }: ProductSpecsProps) {
  const specs = Object.entries(attributes ?? {}).filter(
    ([, value]) => value !== null && value !== "",
  );
  if (specs.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Specs / {categorySlug}
      </p>
      <dl className="mt-6">
        {specs.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-6 border-b border-border py-4"
          >
            <dt className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {label.replaceAll("_", " ")}
            </dt>
            <dd className="text-right text-[13px] font-medium text-foreground">
              {Array.isArray(value) ? value.join(", ") : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
