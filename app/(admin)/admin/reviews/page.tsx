import { listReviewsForAdmin } from "@/lib/reviews";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { ReviewsWorkspace } from "@/components/admin/reviews-workspace";

export default async function AdminReviewsPage() {
  const { reviews } = await listReviewsForAdmin({ pageSize: 1000 });

  const rows = reviews.map((r) => ({
    id: r.id,
    customerName: r.user.name ?? r.user.email,
    productName: r.product.name,
    variant: [r.colorSnapshot, r.sizeSnapshot].filter(Boolean).join(" / "),
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    adminReply: r.adminReply,
    isVerifiedPurchase: r.isVerifiedPurchase,
    createdAt: r.createdAt.toISOString(),
    media: r.media.map((m) => ({ id: m.id, url: m.url, type: m.type })),
  }));

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar title="Đánh giá" crumb="Reviews" />
      <ReviewsWorkspace reviews={rows} />
    </div>
  );
}
