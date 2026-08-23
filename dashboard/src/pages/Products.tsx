import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, PackagePlus, Pencil, Trash2, Search, PackageCheck, PackageX } from "lucide-react";
import { Layout } from "../components/Layout";
import { DataTable, type Column } from "../components/DataTable";
import { Modal, ConfirmModal } from "../components/Modal";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";
import { api, ApiError } from "../api/client";
import { formatDate } from "../utils/formatDate";

type ContentType = "code" | "file" | "link" | "account";

interface Category {
  id: number;
  name: string;
  emoji: string;
}

interface Product {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  content: string;
  contentType: ContentType;
  priceLabel: string;
  isDelivered: boolean;
  deliveredAt: string | null;
  createdAt: string;
}

interface ProductsResponse {
  rows: Product[];
  total: number;
  page: number;
  limit: number;
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  code: "🔑 كود",
  file: "📁 ملف",
  link: "🔗 رابط",
  account: "👤 حساب",
};

const emptyProductForm = {
  categoryId: "",
  name: "",
  description: "",
  priceLabel: "",
  contentType: "code" as ContentType,
  content: "",
};

const emptyBulkForm = {
  categoryId: "",
  name: "",
  priceLabel: "",
  contentType: "code" as ContentType,
  items: "",
};

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "delivered">("in_stock");
  const [typeFilter, setTypeFilter] = useState<ContentType | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: categories } = useApi(() => api.get<Category[]>("/categories"), []);

  const { data, loading, refetch } = useApi(() => {
    const params = new URLSearchParams();
    if (categoryFilter) params.set("category_id", categoryFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return api.get<ProductsResponse>(`/products?${params.toString()}`);
  }, [categoryFilter, statusFilter, typeFilter, search, page]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProductForm);
  const [saving, setSaving] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState(emptyBulkForm);
  const [bulkSaving, setBulkSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Support the "استيراد بالجملة" quick action link from the dashboard home page
  useEffect(() => {
    if (searchParams.get("bulk") === "1") {
      setBulkOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  function categoryName(id: number) {
    return categories?.find((c) => c.id === id)?.name ?? "—";
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyProductForm, categoryId: categories?.[0] ? String(categories[0].id) : "" });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      categoryId: String(p.categoryId),
      name: p.name,
      description: p.description ?? "",
      priceLabel: p.priceLabel,
      contentType: p.contentType,
      content: p.content,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.categoryId || !form.name.trim() || !form.priceLabel.trim() || !form.content.trim()) {
      showToast("من فضلك أكمل كل الحقول المطلوبة", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        categoryId: Number(form.categoryId),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        priceLabel: form.priceLabel.trim(),
        contentType: form.contentType,
        content: form.content.trim(),
      };
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        showToast("تم تحديث المنتج بنجاح");
      } else {
        await api.post("/products", payload);
        showToast("تم إضافة المنتج بنجاح");
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkSave() {
    const items = bulkForm.items
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (!bulkForm.categoryId || !bulkForm.name.trim() || !bulkForm.priceLabel.trim() || items.length === 0) {
      showToast("من فضلك أكمل كل الحقول وأضف عنصر واحد على الأقل", "error");
      return;
    }
    setBulkSaving(true);
    try {
      const res = await api.post<{ count: number }>("/products/bulk", {
        categoryId: Number(bulkForm.categoryId),
        name: bulkForm.name.trim(),
        priceLabel: bulkForm.priceLabel.trim(),
        contentType: bulkForm.contentType,
        items,
      });
      showToast(`تم استيراد ${res.count} منتج بنجاح`);
      setBulkOpen(false);
      setBulkForm(emptyBulkForm);
      refetch();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حدث خطأ", "error");
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.del(`/products/${deleteTarget.id}`);
      showToast("تم حذف المنتج");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "تعذر حذف المنتج", "error");
    } finally {
      setDeleting(false);
    }
  }

  const bulkPreviewCount = bulkForm.items.split("\n").map((l) => l.trim()).filter(Boolean).length;

  const columns: Column<Product>[] = [
    { header: "الاسم", render: (p) => p.name },
    { header: "القسم", render: (p) => categoryName(p.categoryId) },
    { header: "السعر", render: (p) => p.priceLabel },
    { header: "النوع", render: (p) => CONTENT_TYPE_LABELS[p.contentType] },
    {
      header: "الحالة",
      render: (p) => (
        <span className={`badge ${p.isDelivered ? "badge-muted" : "badge-success"}`}>
          {p.isDelivered ? <PackageX size={12} strokeWidth={2} /> : <PackageCheck size={12} strokeWidth={2} />}
          {p.isDelivered ? "مُسلّم" : "متاح"}
        </span>
      ),
    },
    { header: "التاريخ", render: (p) => formatDate(p.isDelivered ? p.deliveredAt : p.createdAt) },
    {
      header: "إجراءات",
      render: (p) => (
        <div className="flex-row">
          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
            <Pencil size={13} strokeWidth={1.75} />
            تعديل
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p)}>
            <Trash2 size={13} strokeWidth={1.75} />
            حذف
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout title="المنتجات">
      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        loading={loading}
        keyExtractor={(p) => p.id}
        emptyTitle="لا توجد منتجات مطابقة"
        page={page}
        limit={limit}
        total={data?.total ?? 0}
        onPageChange={setPage}
        toolbar={
          <>
            <div className="table-toolbar-filters">
              <div className="input-wrap" style={{ width: 200 }}>
                <Search size={15} strokeWidth={1.75} />
                <input
                  className="input"
                  placeholder="بحث بالاسم..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
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
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setPage(1);
                }}
              >
                <option value="in_stock">متاح فقط</option>
                <option value="delivered">مُسلّم فقط</option>
                <option value="all">الكل</option>
              </select>
              <select
                className="select"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as typeof typeFilter);
                  setPage(1);
                }}
              >
                <option value="">كل الأنواع</option>
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-row">
              <button className="btn btn-secondary" onClick={() => setBulkOpen(true)}>
                <PackagePlus size={16} strokeWidth={1.75} />
                استيراد بالجملة
              </button>
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} strokeWidth={1.75} />
                إضافة منتج
              </button>
            </div>
          </>
        }
      />

      {/* Add / edit single product */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "تعديل المنتج" : "إضافة منتج"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </>
        }
      >
        <div className="field">
          <label>القسم</label>
          <select className="select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">اختر القسم</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>اسم المنتج</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>السعر (للعرض فقط)</label>
          <input className="input" value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} />
        </div>
        <div className="field">
          <label>نوع المحتوى</label>
          <select
            className="select"
            value={form.contentType}
            onChange={(e) => setForm({ ...form, contentType: e.target.value as ContentType })}
          >
            {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>
            {form.contentType === "account"
              ? "المحتوى (اليوزر:الباسورد)"
              : form.contentType === "file"
                ? "معرّف الملف (file_id من تيليجرام)"
                : "المحتوى (الكود / الرابط)"}
          </label>
          <textarea className="textarea" rows={2} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </div>
        <div className="field">
          <label>وصف إضافي (اختياري)</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </Modal>

      {/* Bulk import */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="استيراد بالجملة"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setBulkOpen(false)} disabled={bulkSaving}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleBulkSave} disabled={bulkSaving}>
              {bulkSaving ? "جاري الاستيراد..." : `استيراد ${bulkPreviewCount} منتج`}
            </button>
          </>
        }
      >
        <div className="field">
          <label>القسم</label>
          <select
            className="select"
            value={bulkForm.categoryId}
            onChange={(e) => setBulkForm({ ...bulkForm, categoryId: e.target.value })}
          >
            <option value="">اختر القسم</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>اسم المنتج (يتكرر لكل عنصر)</label>
          <input className="input" value={bulkForm.name} onChange={(e) => setBulkForm({ ...bulkForm, name: e.target.value })} />
        </div>
        <div className="field">
          <label>السعر</label>
          <input
            className="input"
            value={bulkForm.priceLabel}
            onChange={(e) => setBulkForm({ ...bulkForm, priceLabel: e.target.value })}
          />
        </div>
        <div className="field">
          <label>نوع المحتوى</label>
          <select
            className="select"
            value={bulkForm.contentType}
            onChange={(e) => setBulkForm({ ...bulkForm, contentType: e.target.value as ContentType })}
          >
            {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>الأكواد/الروابط — كل واحد في سطر جديد</label>
          <textarea
            className="textarea"
            rows={6}
            value={bulkForm.items}
            onChange={(e) => setBulkForm({ ...bulkForm, items: e.target.value })}
            placeholder={"XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY"}
          />
          <span className="text-muted">سيتم إنشاء {bulkPreviewCount} منتج</span>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المنتج"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        loading={deleting}
      />
    </Layout>
  );
}
