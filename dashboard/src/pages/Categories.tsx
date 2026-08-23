import { useState } from "react";
import { FolderPlus, Pencil, Eye, EyeOff, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Layout } from "../components/Layout";
import { DataTable, type Column } from "../components/DataTable";
import { Modal, ConfirmModal } from "../components/Modal";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";
import { api, ApiError } from "../api/client";

interface Category {
  id: number;
  name: string;
  emoji: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  inStockCount: number;
  deliveredCount: number;
}

interface CategoryFormState {
  name: string;
  emoji: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: CategoryFormState = { name: "", emoji: "📦", description: "", sortOrder: "0", isActive: true };

export function Categories() {
  const { data, loading, refetch } = useApi(() => api.get<Category[]>("/categories"), []);
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({
      name: cat.name,
      emoji: cat.emoji,
      description: cat.description ?? "",
      sortOrder: String(cat.sortOrder),
      isActive: cat.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.emoji.trim()) {
      showToast("الاسم والإيموجي مطلوبان", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        emoji: form.emoji.trim(),
        description: form.description.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await api.put(`/categories/${editing.id}`, payload);
        showToast("تم تحديث القسم بنجاح");
      } else {
        await api.post("/categories", payload);
        showToast("تم إنشاء القسم بنجاح");
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(cat: Category) {
    try {
      await api.put(`/categories/${cat.id}`, { isActive: !cat.isActive });
      showToast(cat.isActive ? "تم إخفاء القسم" : "تم تفعيل القسم");
      refetch();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حدث خطأ", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.del(`/categories/${deleteTarget.id}`);
      showToast("تم حذف القسم");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "تعذر حذف القسم", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Category>[] = [
    { header: "الاسم", render: (c) => `${c.emoji} ${c.name}` },
    { header: "المنتجات", render: (c) => `${c.inStockCount} متاح / ${c.deliveredCount} مُسلّم` },
    { header: "الترتيب", render: (c) => c.sortOrder },
    {
      header: "الحالة",
      render: (c) => (
        <span className={`badge ${c.isActive ? "badge-success" : "badge-muted"}`}>
          {c.isActive ? <CheckCircle2 size={12} strokeWidth={2} /> : <Circle size={12} strokeWidth={2} />}
          {c.isActive ? "نشط" : "مخفي"}
        </span>
      ),
    },
    {
      header: "إجراءات",
      render: (c) => (
        <div className="flex-row">
          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
            <Pencil size={13} strokeWidth={1.75} />
            تعديل
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleToggleActive(c)}>
            {c.isActive ? <EyeOff size={13} strokeWidth={1.75} /> : <Eye size={13} strokeWidth={1.75} />}
            {c.isActive ? "إخفاء" : "تفعيل"}
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)}>
            <Trash2 size={13} strokeWidth={1.75} />
            حذف
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout title="الأقسام">
      <DataTable
        columns={columns}
        rows={data ?? []}
        loading={loading}
        keyExtractor={(c) => c.id}
        emptyTitle="لا توجد أقسام بعد"
        emptySubtitle="أضف أول قسم لبدء بيع المنتجات"
        toolbar={
          <div style={{ marginRight: "auto" }}>
            <button className="btn btn-primary" onClick={openCreate}>
              <FolderPlus size={16} strokeWidth={1.75} />
              إضافة قسم
            </button>
          </div>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "تعديل القسم" : "إضافة قسم"}
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
          <label>اسم القسم</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>الإيموجي</label>
          <input className="input" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        </div>
        <div className="field">
          <label>الوصف (اختياري)</label>
          <textarea
            className="textarea"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="field">
          <label>ترتيب العرض</label>
          <input
            className="input"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="flex-row" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <span>قسم نشط (ظاهر للمستخدمين)</span>
          </label>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف القسم"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ سيتم حذف كل منتجاته أيضًا.`}
        loading={deleting}
      />
    </Layout>
  );
}
