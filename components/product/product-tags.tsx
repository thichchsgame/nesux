export function ProductTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
      {tags.map((tag) => (
        <span key={tag} className="border border-border px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {tag}
        </span>
      ))}
    </div>
  );
}
