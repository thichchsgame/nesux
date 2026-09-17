import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { RecordView } from "@/components/product/record-view";
import { VariantSelector } from "@/components/product/variant-selector";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductSpecs } from "@/components/product/product-specs";
import { ProductTags } from "@/components/product/product-tags";
import { ProductCard } from "@/components/product/product-card";
import { auth } from "@/lib/auth";
import { isInWishlist } from "@/lib/wishlist";
import {
  getReviewablePurchases,
  getUserReviewsForProduct,
} from "@/lib/reviews";
import { ReviewForm } from "@/components/product/review-form";
import { ReviewItem } from "@/components/product/review-item";
import {
  getUserQuestionsForProduct,
  listQuestionsForProduct,
} from "@/lib/questions";
import { AskQuestionSection } from "@/components/product/ask-question-section";
import { QuestionItem } from "@/components/product/question-item";
import { getSizeGuideForCategory } from "@/lib/size-guide";
import { SizeGuideModal } from "@/components/product/size-guide-modal";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const sizeGuide = product.variants.some((variant) => variant.size)
    ? getSizeGuideForCategory(product.category.slug)
    : null;
  const related = await getRelatedProducts(product.id, product.categoryId, 4);
  const session = await auth();
  const wishlisted = session?.user?.id
    ? await isInWishlist(session.user.id, product.id)
    : false;
  const [publicQuestions, userQuestions] = session?.user?.id
    ? await Promise.all([
        listQuestionsForProduct(product.id),
        getUserQuestionsForProduct(session.user.id, product.id),
      ])
    : [await listQuestionsForProduct(product.id), []];
  const userQuestionIds = new Set(userQuestions.map((question) => question.id));
  const allQuestions = [
    ...userQuestions,
    ...publicQuestions.filter((question) => !userQuestionIds.has(question.id)),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const [userReviews, reviewablePurchases] = session?.user?.id
    ? await Promise.all([
        getUserReviewsForProduct(session.user.id, product.id),
        getReviewablePurchases(session.user.id, product.id),
      ])
    : [[], []];
  const userReviewIds = new Set(userReviews.map((review) => review.userId));
  const allReviews = [
    ...userReviews,
    ...product.reviews.filter((review) => !userReviewIds.has(review.userId)),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="min-h-screen bg-background">
      <RecordView productId={product.id} />
      <main className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-14">
        <Link
          href={`/products?category=${product.category.slug}`}
          className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={1.5}
          />
          {product.category.name}
        </Link>
        <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
          <ProductGallery images={product.images} productName={product.name} />
          <div className="md:sticky md:top-24 md:self-start">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>{product.category.name}</span>
              {product.avgRating !== null && (
                <span className="text-foreground">
                  ★ {product.avgRating.toFixed(1)} ({product.reviewCount})
                </span>
              )}
            </div>
            <h1 className="font-hand mt-4 text-4xl font-bold uppercase leading-[0.95] tracking-tight text-foreground md:text-5xl">
              {product.name}
            </h1>
            {product.description && (
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            )}
            <div className="mt-8">
              <VariantSelector
                variants={product.variants}
                basePrice={product.basePrice}
                compareAtPrice={product.compareAtPrice}
                productId={product.id}
                productSlug={product.slug}
                productName={product.name}
                initialWishlisted={wishlisted}
              />
            </div>
            {sizeGuide && (
              <div className="mt-3">
                <SizeGuideModal guide={sizeGuide} />
              </div>
            )}
            <ProductTags tags={product.tags} />
            <ProductSpecs
              categorySlug={product.category.slug}
              attributes={product.attributes as Record<string, unknown> | null}
            />
          </div>
        </div>
        <section className="mt-20 border-t border-border pt-12 md:mt-28">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Community notes
              </p>
              <h2 className="font-hand text-3xl font-bold uppercase tracking-tight text-foreground md:text-5xl">
                Đánh giá
              </h2>
            </div>
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-5 border border-border px-5 py-4">
                <div>
                  <p className="font-hand text-3xl text-foreground">
                    {(product.avgRating ?? 0).toFixed(1)}
                  </p>
                  <div
                    className="mt-1 flex gap-0.5"
                    aria-label={`${(product.avgRating ?? 0).toFixed(1)} trên 5 sao`}
                  >
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className="size-3 fill-foreground text-foreground"
                      />
                    ))}
                  </div>
                </div>
                <div className="h-10 w-px bg-border" />
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {product.reviewCount} đánh giá đã xác thực
                </p>
              </div>
            )}
          </div>
          {allReviews.length > 0 ? (
            <div className="mt-10 divide-y divide-border border-y border-border">
              {allReviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  productId={product.id}
                  productSlug={product.slug}
                  isOwner={userReviewIds.has(review.userId)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-sm text-muted-foreground">
              Chưa có đánh giá nào cho sản phẩm này.
            </p>
          )}
          <div className="mt-8 max-w-2xl space-y-6">
            {!session?.user?.id && (
              <p className="text-sm text-muted-foreground">
                <Link href="/sign-in" className="underline">
                  Đăng nhập
                </Link>{" "}
                để viết đánh giá.
              </p>
            )}
            {reviewablePurchases.map((purchase) => (
              <ReviewForm
                key={purchase.id}
                mode="create"
                productId={product.id}
                productSlug={product.slug}
                orderItemId={purchase.id}
                variantLabel={
                  [purchase.colorSnapshot, purchase.sizeSnapshot]
                    .filter(Boolean)
                    .join(" / ") || undefined
                }
              />
            ))}
          </div>
          <section className="mt-16 border-t border-border pt-10">
            <AskQuestionSection
              productId={product.id}
              productSlug={product.slug}
              isLoggedIn={!!session?.user?.id}
            />
            {allQuestions.length > 0 ? (
              <div className="mt-8 divide-y divide-border border-y border-border">
                {allQuestions.map((question) => (
                  <QuestionItem
                    key={question.id}
                    question={question}
                    productSlug={product.slug}
                    isOwner={question.userId === session?.user?.id}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-8 text-sm text-muted-foreground">
                Chưa có câu hỏi nào — hỏi về form, chất liệu hoặc cách bảo quản.
              </p>
            )}
          </section>
        </section>
        <ProductRow title="More from the system" products={related} />
      </main>
    </div>
  );
}

function ProductRow({
  title,
  products,
}: {
  title: string;
  products: Awaited<ReturnType<typeof getRelatedProducts>>;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mt-20 border-t border-border pt-12 md:mt-28">
      <h2 className="font-hand mb-10 text-2xl font-bold uppercase tracking-tight text-foreground md:text-3xl">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}
