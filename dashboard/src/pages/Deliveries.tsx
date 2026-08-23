import { useState } from "react";
import { Download } from "lucide-react";
import { Layout } from "../components/Layout";
import { DataTable, type Column } from "../components/DataTable";
import { useApi } from "../hooks/useApi";
import { api, getToken } from "../api/client";
import { formatDateTime } from "../utils/formatDate";

interface Category {
  id: number;
  name: string;
  emoji: string;
}

interface DeliveryRow {
  id: number;
  productName: string;
  categoryName: string;
  contentType: string;
  deliveredAt: string;
  telegramId: number;
  username: string | null;
  firstName: string;
}

interface DeliveriesResponse {
  rows: DeliveryRow[];
  total: number;
  page: number;
  limit: number;
}

export function Deliveries() {
  const { data: categories } = useApi(() => api.get<Category[]>("/categories"), []);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, loading } = useApi(() => {
    const params = new URLSearchParams();
    if (categoryFilter) params.set("category", categoryFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return api.get<DeliveriesResponse>(`/deliveries?${params.toString()}`);
  }, [categoryFilter, from, to, page]);

  function handleExport() {
    const params = new URLSearchParams();
    if (categoryFilter) params.set("category", categoryFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const token = getToken();
    // Direct navigation can't send an Authorization header, so we fetch + blob-download instead.
    fetch(`/api/deliveries/export?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `deliveries-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  const columns: Column<DeliveryRow>[] = [
    { header: "المنتج", render: (r) => r.productName },
    { header: "القسم", render: (r) => r.categoryName },
    { header: "المستخدم", render: (r) => (r.username ? `@${r.username}` : r.firstName) },
    { header: "معرّف تيليجرام", render: (r) => <span className="mono">{r.telegramId}</span> },
    { header: "التاريخ", render: (r) => formatDateTime(r.deliveredAt) },
  ];

  return (
    <Layout title="التسليمات">
      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyTitle="لا توجد تسليمات مطابقة"
        page={page}
        limit={limit}
        total={data?.total ?? 0}
        onPageChange={setPage}
        toolbar={
          <>
            <div className="table-toolbar-filters">
              <select
                className="select"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">كل الأقسام</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
              <input
                className="input"
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={16} strokeWidth={1.75} />
              تصدير CSV
            </button>
          </>
        }
      />
    </Layout>
  );
}
