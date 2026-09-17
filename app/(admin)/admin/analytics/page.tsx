import { getAnalyticsOverview } from "@/lib/analytics";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AnalyticsWorkspace } from "@/components/admin/analytics-workspace";

const RANGE_DAYS: Record<string, number> = {
  "7 ngày": 7,
  "30 ngày": 30,
  "90 ngày": 90,
  "12 tháng": 365,
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const rangeLabel = range && RANGE_DAYS[range] ? range : "90 ngày";
  const data = await getAnalyticsOverview(RANGE_DAYS[rangeLabel]);

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar title="Thống kê" crumb="Analytics" />
      <AnalyticsWorkspace data={data} rangeLabel={rangeLabel} />
    </div>
  );
}
