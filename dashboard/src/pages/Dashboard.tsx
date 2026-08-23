import { Link } from "react-router-dom";
import { Package, CheckCircle2, Users2, FolderOpen, Plus, PackagePlus, Megaphone } from "lucide-react";
import { Layout } from "../components/Layout";
import { StatsCard } from "../components/StatsCard";
import { DataTable, type Column } from "../components/DataTable";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";
import { api } from "../api/client";
import { formatNumber } from "../utils/formatNumber";
import { relativeTime } from "../utils/formatDate";

interface RecentDelivery {
  id: number;
  productName: string;
  categoryName: string;
  deliveredAt: string;
  username: string | null;
  firstName: string;
}

interface DashboardStats {
  totalProducts: number;
  totalInStock: number;
  totalDelivered: number;
  totalUsers: number;
  todayNewUsers: number;
  weekNewUsers: number;
  totalDeliveries: number;
  todayDeliveries: number;
  weekDeliveries: number;
  activeCategories: number;
  emptyCategories: number;
  recentDeliveries: RecentDelivery[];
}

const columns: Column<RecentDelivery>[] = [
  { header: "المنتج", render: (r) => r.productName },
  { header: "القسم", render: (r) => r.categoryName },
  { header: "المستخدم", render: (r) => (r.username ? `@${r.username}` : r.firstName) },
  { header: "التاريخ", render: (r) => relativeTime(r.deliveredAt) },
];

export function Dashboard() {
  const { data, loading } = useApi(() => api.get<DashboardStats>("/dashboard/stats"), []);
  const { showToast } = useToast();

  return (
    <Layout title="الرئيسية">
      <div className="stats-grid">
        <StatsCard
          icon={<Package size={18} strokeWidth={1.75} />}
          label="إجمالي المنتجات"
          value={loading ? "…" : formatNumber(data?.totalProducts)}
          subtitle={loading ? undefined : `${formatNumber(data?.todayDeliveries)} تم تسليمها اليوم`}
        />
        <StatsCard
          variant="info"
          icon={<CheckCircle2 size={18} strokeWidth={1.75} />}
          label="إجمالي التسليمات"
          value={loading ? "…" : formatNumber(data?.totalDeliveries)}
          subtitle={loading ? undefined : `+${formatNumber(data?.weekDeliveries)} هذا الأسبوع`}
        />
        <StatsCard
          variant="warning"
          icon={<Users2 size={18} strokeWidth={1.75} />}
          label="المستخدمين"
          value={loading ? "…" : formatNumber(data?.totalUsers)}
          subtitle={loading ? undefined : `+${formatNumber(data?.todayNewUsers)} اليوم`}
        />
        <StatsCard
          variant="muted"
          icon={<FolderOpen size={18} strokeWidth={1.75} />}
          label="الأقسام النشطة"
          value={loading ? "…" : formatNumber(data?.activeCategories)}
          subtitle={loading ? undefined : `${formatNumber(data?.emptyCategories)} فارغة`}
        />
      </div>

      <h3 style={{ marginBottom: 12 }}>آخر التسليمات</h3>
      <DataTable
        columns={columns}
        rows={data?.recentDeliveries ?? []}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyTitle="لا توجد تسليمات بعد"
      />

      <div className="quick-actions">
        <Link to="/products" className="btn btn-primary">
          <Plus size={16} strokeWidth={1.75} />
          إضافة منتج
        </Link>
        <Link to="/products?bulk=1" className="btn btn-secondary">
          <PackagePlus size={16} strokeWidth={1.75} />
          استيراد بالجملة
        </Link>
        <button
          className="btn btn-secondary"
          onClick={() => showToast("الرسالة الجماعية تُرسل عبر أمر /broadcast في البوت على تيليجرام", "success")}
        >
          <Megaphone size={16} strokeWidth={1.75} />
          رسالة جماعية
        </button>
      </div>
    </Layout>
  );
}
