import { useState } from "react";
import { Search, Ban, ShieldCheck, Eye, UserCheck, UserX } from "lucide-react";
import { Layout } from "../components/Layout";
import { DataTable, type Column } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";
import { api, ApiError } from "../api/client";
import { formatDate, formatDateTime } from "../utils/formatDate";
import { formatNumber } from "../utils/formatNumber";

interface User {
  id: number;
  telegramId: number;
  username: string | null;
  firstName: string;
  lastName: string | null;
  isBlocked: boolean;
  totalReceived: number;
  firstSeen: string;
  lastSeen: string;
}

interface UserDelivery {
  id: number;
  productName: string;
  categoryName: string;
  deliveredAt: string;
}

interface UsersResponse {
  rows: User[];
  total: number;
  page: number;
  limit: number;
}

export function Users() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const { showToast } = useToast();

  const { data, loading, refetch } = useApi(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return api.get<UsersResponse>(`/users?${params.toString()}`);
  }, [search, page]);

  const [detailUser, setDetailUser] = useState<User | null>(null);
  const { data: detail, loading: detailLoading } = useApi(
    () => (detailUser ? api.get<User & { deliveries: UserDelivery[] }>(`/users/${detailUser.id}`) : Promise.resolve(null)),
    [detailUser?.id]
  );

  async function toggleBlock(user: User) {
    try {
      await api.put(`/users/${user.id}/block`, { is_blocked: !user.isBlocked });
      showToast(user.isBlocked ? "تم إلغاء حظر المستخدم" : "تم حظر المستخدم");
      refetch();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حدث خطأ", "error");
    }
  }

  const columns: Column<User>[] = [
    { header: "معرّف تيليجرام", render: (u) => <span className="mono">{u.telegramId}</span> },
    { header: "اليوزرنيم", render: (u) => (u.username ? `@${u.username}` : "—") },
    { header: "الاسم", render: (u) => `${u.firstName} ${u.lastName ?? ""}`.trim() },
    { header: "المنتجات المستلمة", render: (u) => formatNumber(u.totalReceived) },
    { header: "أول ظهور", render: (u) => formatDate(u.firstSeen) },
    { header: "آخر ظهور", render: (u) => formatDate(u.lastSeen) },
    {
      header: "الحالة",
      render: (u) => (
        <span className={`badge ${u.isBlocked ? "badge-error" : "badge-success"}`}>
          {u.isBlocked ? <UserX size={12} strokeWidth={2} /> : <UserCheck size={12} strokeWidth={2} />}
          {u.isBlocked ? "محظور" : "نشط"}
        </span>
      ),
    },
    {
      header: "إجراءات",
      render: (u) => (
        <div className="flex-row">
          <button className="btn btn-secondary btn-sm" onClick={() => setDetailUser(u)}>
            <Eye size={13} strokeWidth={1.75} />
            التفاصيل
          </button>
          <button className={`btn btn-sm ${u.isBlocked ? "btn-secondary" : "btn-danger"}`} onClick={() => toggleBlock(u)}>
            {u.isBlocked ? <ShieldCheck size={13} strokeWidth={1.75} /> : <Ban size={13} strokeWidth={1.75} />}
            {u.isBlocked ? "إلغاء الحظر" : "حظر"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout title="المستخدمين">
      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        loading={loading}
        keyExtractor={(u) => u.id}
        emptyTitle="لا يوجد مستخدمين بعد"
        page={page}
        limit={limit}
        total={data?.total ?? 0}
        onPageChange={setPage}
        toolbar={
          <div className="input-wrap" style={{ maxWidth: 280 }}>
            <Search size={15} strokeWidth={1.75} />
            <input
              className="input"
              placeholder="بحث بالاسم أو اليوزرنيم..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        }
      />

      <Modal
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        title={detailUser ? `${detailUser.firstName} ${detailUser.lastName ?? ""}`.trim() : ""}
      >
        {detailLoading ? (
          <p className="text-secondary">جاري التحميل...</p>
        ) : (
          <>
            <p className="text-secondary" style={{ marginBottom: 16 }}>
              معرّف تيليجرام: <span className="mono">{detailUser?.telegramId}</span>
              {detailUser?.username && <> — @{detailUser.username}</>}
            </p>
            <h4 style={{ marginBottom: 10 }}>سجل الطلبات</h4>
            {detail?.deliveries.length ? (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {detail.deliveries.map((d) => (
                  <li
                    key={d.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span>
                      {d.categoryName} — {d.productName}
                    </span>
                    <span className="text-muted">{formatDateTime(d.deliveredAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">لا يوجد طلبات سابقة.</p>
            )}
          </>
        )}
      </Modal>
    </Layout>
  );
}
