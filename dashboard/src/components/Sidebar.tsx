import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Package, ClipboardList, Users2, Bot } from "lucide-react";

const links = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard, end: true },
  { to: "/categories", label: "الأقسام", icon: FolderOpen },
  { to: "/products", label: "المنتجات", icon: Package },
  { to: "/deliveries", label: "التسليمات", icon: ClipboardList },
  { to: "/users", label: "المستخدمين", icon: Users2 },
];

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate?: () => void }) {
  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="sidebar-logo">
        <span className="sidebar-logo-badge">
          <Bot size={18} strokeWidth={1.75} />
        </span>
        <span>متجر التسليم الآلي</span>
      </div>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onNavigate}
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          <link.icon size={18} strokeWidth={1.75} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
