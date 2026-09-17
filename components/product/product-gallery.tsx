import Image from "next/image";

type ProductImage = { id: string; url: string; altText: string | null };

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  if (images.length === 0) return <div className="aspect-[4/3] bg-card" />;

  return (
    <div className="grid grid-cols-2 gap-3">
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`relative overflow-hidden bg-[var(--hero-product-bg)] ${index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}
        >
          <Image
            src={image.url}
            alt={image.altText ?? productName}
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 50vw, 40vw"
            className="object-contain"
          />
          <span className="absolute left-3 top-3 text-[10px] uppercase tracking-[0.2em] text-[var(--hero-product-fg)]/60">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
}
