"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RowActions, standardRowActions } from "@/components/ui/row-actions";
import { useSession } from "@/lib/session";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_OPTIONS,
  HIERARCHY_OPTIONS,
  OFFICE_PAGES,
  PERMISSION_LEVELS,
  SEED_AUDIT,
  SEED_OFFICES,
  SEED_ROLES,
  SEED_TENANTS,
  SEED_USERS,
  STORAGE_KEY,
  SYSTEMS,
  TENANT_SYSTEMS,
  type AdminUser,
  type AuditEntry,
  type RoleDef,
} from "@/data/roles-permissions-data";

type TabId =
  | "roles"
  | "permissions"
  | "users"
  | "audit"
  | "office"
  | "tenant"
  | "accountTypeSidebar";

type Store = {
  roles: RoleDef[];
  users: AdminUser[];
  audit: AuditEntry[];
  officeAccess: Record<string, string[]>;
  tenantAccess: Record<string, { pages: string[]; systems: string[] }>;
  sidebarByType: Record<string, string[]>;
};

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "roles", label: "إدارة الأدوار", icon: "📋" },
  { id: "permissions", label: "الصلاحيات", icon: "🔒" },
  { id: "users", label: "تعيين الأدوار", icon: "🏷️" },
  { id: "audit", label: "سجل العمليات", icon: "🕒" },
  { id: "office", label: "صلاحيات المكاتب", icon: "🏢" },
  { id: "tenant", label: "صلاحيات المستأجرين", icon: "🏙" },
  { id: "accountTypeSidebar", label: "القائمة الجانبية", icon: "☰" },
];

const FA_CSS = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
const FA_LINK_ID = "fa-cdn-roles-permissions";

function defaultStore(): Store {
  return {
    roles: structuredClone(SEED_ROLES),
    users: structuredClone(SEED_USERS),
    audit: structuredClone(SEED_AUDIT),
    officeAccess: Object.fromEntries(
      Object.entries(SEED_OFFICES).map(([k, v]) => [k, [...v.pages]]),
    ),
    tenantAccess: Object.fromEntries(
      Object.entries(SEED_TENANTS).map(([k, v]) => [k, { pages: [...v.pages], systems: [...v.systems] }]),
    ),
    sidebarByType: {
      BRANCH: ["dashboard", "cases", "clients", "sessions", "finance", "reports"],
      OFFICE: ["dashboard", "cases", "sessions", "archive", "clients"],
      INCUBATOR: ["dashboard", "network", "library", "consultations"],
      TENANT: ["dashboard", "cases", "sessions", "finance"],
      PLATFORM: OFFICE_PAGES.map((p) => p.key),
      HQ: OFFICE_PAGES.map((p) => p.key),
    },
  };
}

function loadStore(): Store {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.roles?.length) return defaultStore();
    return { ...defaultStore(), ...parsed };
  } catch {
    return defaultStore();
  }
}

function formatLimit(n: number | null) {
  if (n === null || n === undefined) return "∞";
  return n.toLocaleString("en-US");
}

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function recountRoleUsers(roles: RoleDef[], users: AdminUser[]): RoleDef[] {
  return roles.map((r) => ({
    ...r,
    users_count: users.filter((u) => u.role_code === r.code).length,
    systems_count: Object.values(r.permissions).filter((l) => l && l !== "NONE").length,
  }));
}

export function RolesPermissionsPage({ embedded = false }: { embedded?: boolean }) {
  const { user, ready } = useSession(true);
  const [store, setStore] = useState<Store>(defaultStore);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<TabId>("roles");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [roleSearch, setRoleSearch] = useState("");
  const [permRole, setPermRole] = useState("");
  const [permDraft, setPermDraft] = useState<Record<string, string>>({});

  const [userSearch, setUserSearch] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [assignRoleCode, setAssignRoleCode] = useState("");

  const [roleModal, setRoleModal] = useState<"create" | "edit" | null>(null);
  const [editingRoleCode, setEditingRoleCode] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState({
    code: "",
    title_ar: "",
    title_en: "",
    description: "",
    hierarchy_level: 2,
    max_approval_limit: 0,
    is_active: true,
  });

  const [userModal, setUserModal] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    account_type: "HQ",
    entity_id: "",
    entity_name: "",
    job_title: "",
    is_active: true,
  });

  const [officeId, setOfficeId] = useState("");
  const [officePages, setOfficePages] = useState<string[]>([]);
  const [officeOpen, setOfficeOpen] = useState(false);
  const [officeInfo, setOfficeInfo] = useState<{ name: string; code: string } | null>(null);

  const [tenantId, setTenantId] = useState("");
  const [tenantSystems, setTenantSystems] = useState<string[]>([]);
  const [tenantPages, setTenantPages] = useState<string[]>([]);
  const [tenantInfo, setTenantInfo] = useState<{ name: string; subdomain: string; entity_id: string } | null>(null);

  const [accountType, setAccountType] = useState("");
  const [sidebarPages, setSidebarPages] = useState<string[]>([]);

  useEffect(() => {
    if (document.getElementById(FA_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FA_LINK_ID;
    link.rel = "stylesheet";
    link.href = FA_CSS;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    setStore(loadStore());
    setHydrated(true);
    const params = new URLSearchParams(window.location.search);
    const q = params.get("tab") as TabId | null;
    if (q && TABS.some((t) => t.id === q)) setTab(q);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, hydrated]);

  const pushToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const pushAudit = useCallback((entry: Omit<AuditEntry, "id" | "date">) => {
    setStore((prev) => ({
      ...prev,
      audit: [{ id: `a-${Date.now()}`, date: nowStamp(), ...entry }, ...prev.audit],
    }));
  }, []);

  const switchTab = (id: TabId) => {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  };

  const roles = store.roles;
  const users = store.users;

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.title_ar.includes(roleSearch.trim()) ||
        r.title_en.toLowerCase().includes(q),
    );
  }, [roles, roleSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (userStatus === "true" && !u.is_active) return false;
      if (userStatus === "false" && u.is_active) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.entity_name.toLowerCase().includes(q) ||
        u.entity_id.toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
    });
  }, [users, userSearch, userStatus]);

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;

  const activePermCount = useMemo(
    () =>
      roles.reduce(
        (sum, r) => sum + Object.values(r.permissions).filter((l) => l && l !== "NONE").length,
        0,
      ),
    [roles],
  );

  const openCreateRole = () => {
    setRoleForm({
      code: "",
      title_ar: "",
      title_en: "",
      description: "",
      hierarchy_level: 2,
      max_approval_limit: 0,
      is_active: true,
    });
    setEditingRoleCode(null);
    setRoleModal("create");
  };

  const openEditRole = (code: string) => {
    const role = roles.find((r) => r.code === code);
    if (!role) return;
    setEditingRoleCode(code);
    setRoleForm({
      code: role.code,
      title_ar: role.title_ar,
      title_en: role.title_en,
      description: role.description,
      hierarchy_level: role.hierarchy_level,
      max_approval_limit: role.max_approval_limit ?? 0,
      is_active: role.is_active,
    });
    setRoleModal("edit");
  };

  const saveRole = () => {
    if (roleModal === "create") {
      const code = roleForm.code.trim().toUpperCase().replace(/\s+/g, "_");
      if (!code || !roleForm.title_ar.trim()) {
        pushToast("error", "رمز الدور والاسم العربي مطلوبان");
        return;
      }
      if (roles.some((r) => r.code === code)) {
        pushToast("error", "رمز الدور موجود مسبقاً");
        return;
      }
      const next: RoleDef = {
        code,
        title_ar: roleForm.title_ar.trim(),
        title_en: roleForm.title_en.trim() || code,
        description: roleForm.description.trim(),
        hierarchy_level: roleForm.hierarchy_level,
        max_approval_limit: roleForm.max_approval_limit || 0,
        is_active: true,
        users_count: 0,
        systems_count: 0,
        permissions: Object.fromEntries(SYSTEMS.map((s) => [s.code, "NONE"])),
      };
      setStore((prev) => ({ ...prev, roles: [next, ...prev.roles] }));
      pushAudit({ type: "ROLE", entity_id: code, action: "إنشاء دور جديد", by: user?.name ?? "مسؤول" });
      pushToast("success", "تم إنشاء الدور بنجاح");
    } else if (editingRoleCode) {
      setStore((prev) => ({
        ...prev,
        roles: prev.roles.map((r) =>
          r.code === editingRoleCode
            ? {
                ...r,
                title_ar: roleForm.title_ar.trim(),
                title_en: roleForm.title_en.trim(),
                description: roleForm.description.trim(),
                hierarchy_level: roleForm.hierarchy_level,
                max_approval_limit: roleForm.max_approval_limit || 0,
                is_active: roleForm.is_active,
              }
            : r,
        ),
      }));
      pushAudit({ type: "ROLE", entity_id: editingRoleCode, action: "تعديل الدور", by: user?.name ?? "مسؤول" });
      pushToast("success", "تم تحديث الدور");
    }
    setRoleModal(null);
  };

  const deleteRole = (code: string) => {
    if (!confirm(`حذف الدور ${code}؟`)) return;
    setStore((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.code !== code),
      users: prev.users.map((u) => (u.role_code === code ? { ...u, role_code: null } : u)),
    }));
    pushAudit({ type: "ROLE", entity_id: code, action: "حذف الدور", by: user?.name ?? "مسؤول" });
    pushToast("success", "تم حذف الدور");
  };

  useEffect(() => {
    if (!permRole) {
      setPermDraft({});
      return;
    }
    const role = roles.find((r) => r.code === permRole);
    setPermDraft(role ? { ...role.permissions } : {});
  }, [permRole, roles]);

  const savePermissions = () => {
    if (!permRole) return;
    setStore((prev) => ({
      ...prev,
      roles: recountRoleUsers(
        prev.roles.map((r) =>
          r.code === permRole ? { ...r, permissions: { ...permDraft } } : r,
        ),
        prev.users,
      ),
    }));
    pushAudit({ type: "PERMISSION", entity_id: permRole, action: "حفظ مصفوفة الصلاحيات", by: user?.name ?? "مسؤول" });
    pushToast("success", "تم حفظ الصلاحيات بنجاح");
  };

  const openCreateUser = () => {
    setUserForm({
      name: "",
      email: "",
      password: "",
      account_type: "HQ",
      entity_id: "HQ-001",
      entity_name: "المكتب الرئيسي — نايوش",
      job_title: "",
      is_active: true,
    });
    setEditingUserId(null);
    setUserModal("create");
  };

  const openEditUser = (id: number) => {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setEditingUserId(id);
    setUserForm({
      name: u.name,
      email: u.email,
      password: "",
      account_type: u.account_type,
      entity_id: u.entity_id,
      entity_name: u.entity_name,
      job_title: u.job_title,
      is_active: u.is_active,
    });
    setUserModal("edit");
  };

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      pushToast("error", "الاسم والبريد مطلوبان");
      return;
    }
    if (userModal === "create" && !userForm.password.trim()) {
      pushToast("error", "كلمة المرور مطلوبة عند الإضافة");
      return;
    }
    if (userModal === "create") {
      const id = Math.max(0, ...users.map((u) => u.id)) + 1;
      const next: AdminUser = {
        id,
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        account_type: userForm.account_type,
        entity_id: userForm.entity_id.trim() || `U-${id}`,
        entity_name: userForm.entity_name.trim() || "—",
        job_title: userForm.job_title.trim() || "—",
        role_code: null,
        is_active: userForm.is_active,
      };
      setStore((prev) => ({
        ...prev,
        users: [next, ...prev.users],
        roles: recountRoleUsers(prev.roles, [next, ...prev.users]),
      }));
      pushAudit({ type: "USER", entity_id: String(id), action: "إضافة مستخدم جديد", by: user?.name ?? "مسؤول" });
      pushToast("success", "تمت إضافة المستخدم");
      setSelectedUserId(id);
    } else if (editingUserId != null) {
      setStore((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                name: userForm.name.trim(),
                email: userForm.email.trim(),
                account_type: userForm.account_type,
                entity_id: userForm.entity_id.trim(),
                entity_name: userForm.entity_name.trim(),
                job_title: userForm.job_title.trim(),
                is_active: userForm.is_active,
              }
            : u,
        ),
      }));
      pushAudit({ type: "USER", entity_id: String(editingUserId), action: "تعديل بيانات مستخدم", by: user?.name ?? "مسؤول" });
      pushToast("success", "تم تحديث المستخدم");
    }
    setUserModal(null);
  };

  const deleteUser = (id: number) => {
    if (!confirm("حذف هذا المستخدم؟")) return;
    setStore((prev) => {
      const nextUsers = prev.users.filter((u) => u.id !== id);
      return { ...prev, users: nextUsers, roles: recountRoleUsers(prev.roles, nextUsers) };
    });
    if (selectedUserId === id) setSelectedUserId(null);
    pushAudit({ type: "USER", entity_id: String(id), action: "حذف مستخدم", by: user?.name ?? "مسؤول" });
    pushToast("success", "تم حذف المستخدم");
  };

  const selectUser = (id: number) => {
    const u = users.find((x) => x.id === id);
    setSelectedUserId(id);
    setAssignRoleCode(u?.role_code ?? "");
  };

  const assignRole = () => {
    if (!selectedUserId || !assignRoleCode) {
      pushToast("error", "اختر مستخدماً ودوراً");
      return;
    }
    setStore((prev) => {
      const nextUsers = prev.users.map((u) =>
        u.id === selectedUserId ? { ...u, role_code: assignRoleCode } : u,
      );
      return { ...prev, users: nextUsers, roles: recountRoleUsers(prev.roles, nextUsers) };
    });
    pushAudit({
      type: "USER",
      entity_id: String(selectedUserId),
      action: `تعيين دور ${assignRoleCode}`,
      by: user?.name ?? "مسؤول",
    });
    pushToast("success", "تم تعيين الدور");
  };

  const revokeRole = () => {
    if (!selectedUserId) return;
    setStore((prev) => {
      const nextUsers = prev.users.map((u) =>
        u.id === selectedUserId ? { ...u, role_code: null } : u,
      );
      return { ...prev, users: nextUsers, roles: recountRoleUsers(prev.roles, nextUsers) };
    });
    setAssignRoleCode("");
    pushAudit({
      type: "USER",
      entity_id: String(selectedUserId),
      action: "إلغاء الدور",
      by: user?.name ?? "مسؤول",
    });
    pushToast("success", "تم إلغاء الدور");
  };

  const loadOffice = () => {
    const key = officeId.trim();
    if (!key) {
      setOfficeInfo(null);
      return;
    }
    const seed = SEED_OFFICES[key];
    const pages = store.officeAccess[key] ?? seed?.pages ?? [];
    if (!seed && !store.officeAccess[key]) {
      pushToast("error", "المكتب غير موجود — جرّب OF-MAA أو OF-NSR أو 97");
      setOfficeInfo(null);
      return;
    }
    setOfficeInfo({ name: seed?.name ?? `مكتب ${key}`, code: seed?.code ?? key });
    setOfficePages([...pages]);
  };

  const saveOffice = () => {
    const key = officeId.trim();
    if (!key || !officeInfo) return;
    setStore((prev) => ({
      ...prev,
      officeAccess: { ...prev.officeAccess, [key]: [...officePages], [officeInfo.code]: [...officePages] },
    }));
    pushAudit({ type: "OFFICE", entity_id: officeInfo.code, action: "تحديث صلاحيات صفحات المكتب", by: user?.name ?? "مسؤول" });
    pushToast("success", "تم حفظ صلاحيات المكتب");
  };

  const loadTenant = () => {
    const key = tenantId.trim();
    if (!key) {
      setTenantInfo(null);
      return;
    }
    const seed = SEED_TENANTS[key];
    const access = store.tenantAccess[key] ?? (seed ? { pages: seed.pages, systems: seed.systems } : null);
    if (!access) {
      pushToast("error", "المستأجر غير موجود — جرّب TEN000123 أو TN-NIL");
      setTenantInfo(null);
      return;
    }
    setTenantInfo({
      name: seed?.name ?? `مستأجر ${key}`,
      subdomain: seed?.subdomain ?? key,
      entity_id: seed?.entity_id ?? key,
    });
    setTenantPages([...access.pages]);
    setTenantSystems([...access.systems]);
  };

  const saveTenant = () => {
    const key = tenantId.trim();
    if (!key || !tenantInfo) return;
    setStore((prev) => ({
      ...prev,
      tenantAccess: {
        ...prev.tenantAccess,
        [key]: { pages: [...tenantPages], systems: [...tenantSystems] },
        [tenantInfo.entity_id]: { pages: [...tenantPages], systems: [...tenantSystems] },
      },
    }));
    pushAudit({ type: "TENANT", entity_id: tenantInfo.entity_id, action: "تحديث صلاحيات المستأجر", by: user?.name ?? "مسؤول" });
    pushToast("success", "تم حفظ صلاحيات المستأجر");
  };

  const loadSidebar = (type: string) => {
    setAccountType(type);
    setSidebarPages([...(store.sidebarByType[type] ?? [])]);
  };

  const saveSidebar = () => {
    if (!accountType) return;
    setStore((prev) => ({
      ...prev,
      sidebarByType: { ...prev.sidebarByType, [accountType]: [...sidebarPages] },
    }));
    pushAudit({ type: "SIDEBAR", entity_id: accountType, action: "تحديث القائمة الجانبية لنوع الحساب", by: user?.name ?? "مسؤول" });
    pushToast("success", "تم حفظ القائمة الجانبية");
  };

  if (!ready || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#64748b" }}>
        جاري التحميل...
      </div>
    );
  }

  const content = (
    <div className="rp-page">
      <style>{RP_CSS}</style>

      <div className="rp-header">
        <div>
          <h1 className="rp-title">
            <i className="fas fa-shield-alt" style={{ color: "var(--brand)", marginLeft: 8 }} />
            الإدارة والصلاحيات
          </h1>
          <p className="rp-sub">نظام التحكم الكامل في الأدوار والصلاحيات — بيانات تشغيلية غنية</p>
        </div>
        <div className="rp-header-actions">
          <button type="button" className="rp-btn-primary" onClick={openCreateUser}>
            <i className="fas fa-user-plus" /> إضافة مستخدم جديد
          </button>
          <button type="button" className="rp-btn-ghost" onClick={openCreateRole}>
            <i className="fas fa-plus" /> إضافة دور
          </button>
        </div>
      </div>

      <div className="rp-kpis">
        <div className="rp-kpi">
          <div>
            <p>إجمالي الأدوار</p>
            <h3 style={{ color: "var(--brand)" }}>{roles.length}</h3>
          </div>
          <div className="rp-kpi-ico" style={{ background: "#fef2f2", color: "var(--brand)" }}>
            <i className="fas fa-id-badge" />
          </div>
        </div>
        <div className="rp-kpi">
          <div>
            <p>الأنظمة التشغيلية</p>
            <h3 style={{ color: "#2563eb" }}>{SYSTEMS.length}</h3>
          </div>
          <div className="rp-kpi-ico" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <i className="fas fa-server" />
          </div>
        </div>
        <div className="rp-kpi">
          <div>
            <p>الصلاحيات النشطة</p>
            <h3 style={{ color: "#059669" }}>{activePermCount}</h3>
          </div>
          <div className="rp-kpi-ico" style={{ background: "#ecfdf5", color: "#059669" }}>
            <i className="fas fa-key" />
          </div>
        </div>
        <button type="button" className="rp-kpi rp-kpi-btn" onClick={() => switchTab("users")}>
          <div>
            <p>المستخدمين</p>
            <h3 style={{ color: "#7c3aed" }}>{users.length}</h3>
          </div>
          <div className="rp-kpi-ico" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
            <i className="fas fa-users" />
          </div>
        </button>
      </div>

      <div className="rp-tabs-wrap">
        <div className="rp-banner">
          <span>
            <i className="fas fa-paint-brush" /> تم نقل &quot;إدارة الصفحة الرئيسية&quot; إلى إعدادات النظام في القائمة الجانبية
          </span>
          <div className="rp-banner-links">
            <Link href="/app/system-settings" className="rp-chip blue">
              <i className="fas fa-arrow-up-right-from-square" /> افتح إعدادات الصفحة الرئيسية
            </Link>
          </div>
        </div>
        <div className="rp-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`rp-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => switchTab(t.id)}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "roles" && (
        <div className="rp-card">
          <div className="rp-toolbar">
            <div className="rp-search">
              <i className="fas fa-search" />
              <input
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="بحث عن دور..."
              />
            </div>
            <button type="button" className="rp-btn-primary" onClick={openCreateRole}>
              <i className="fas fa-plus" /> إضافة دور جديد
            </button>
          </div>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>المسمى الوظيفي</th>
                  <th>المستوى</th>
                  <th>حد الموافقة</th>
                  <th className="center">المستخدمين</th>
                  <th className="center">الأنظمة</th>
                  <th className="center">الحالة</th>
                  <th className="center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((r) => (
                  <tr key={r.code}>
                    <td className="mono">{r.code}</td>
                    <td className="strong">{r.title_ar}</td>
                    <td>
                      <span className="badge slate">مستوى {r.hierarchy_level}</span>
                    </td>
                    <td className="mono">{formatLimit(r.max_approval_limit)}</td>
                    <td className="center">
                      <span className="count blue">{r.users_count}</span>
                    </td>
                    <td className="center">
                      <span className="count green">{r.systems_count}</span>
                    </td>
                    <td className="center">
                      <span className={`badge ${r.is_active ? "green" : "red"}`}>
                        {r.is_active ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="center">
                      <RowActions
                        iconSet="fa"
                        style={{ justifyContent: "center" }}
                        actions={standardRowActions({
                          onEdit: () => openEditRole(r.code),
                          onDelete: () => deleteRole(r.code),
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "permissions" && (
        <div className="rp-card pad">
          <div className="rp-center-block">
            <h2>مصفوفة الصلاحيات</h2>
            <p>تحكم دقيق في صلاحيات الوصول لكل نظام</p>
            <div className="rp-soft-box">
              <label>اختر الدور لتعديل صلاحياته</label>
              <select value={permRole} onChange={(e) => setPermRole(e.target.value)}>
                <option value="">-- اختر دوراً --</option>
                {roles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.title_ar} ({r.code})
                  </option>
                ))}
              </select>
            </div>
            {permRole && (
              <>
                <div className="rp-perm-grid">
                  {SYSTEMS.map((sys) => {
                    const level = permDraft[sys.code] ?? "NONE";
                    const border =
                      level === "FULL"
                        ? "perm-full"
                        : level !== "NONE"
                          ? "perm-partial"
                          : "perm-none";
                    return (
                      <div key={sys.code} className={`rp-perm-card ${border}`}>
                        <div className="rp-perm-head">
                          <h4>{sys.name_ar}</h4>
                          <i className="fas fa-cogs" />
                        </div>
                        <select
                          value={level}
                          onChange={(e) =>
                            setPermDraft((prev) => ({ ...prev, [sys.code]: e.target.value }))
                          }
                        >
                          {PERMISSION_LEVELS.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.name_ar}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
                <div className="rp-save-row">
                  <button type="button" className="rp-btn-primary lg" onClick={savePermissions}>
                    <i className="fas fa-save" /> حفظ التغييرات
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="rp-stack">
          <div className="rp-card pad">
            <div className="rp-toolbar">
              <div>
                <h2 className="rp-h2">إدارة المستخدمين</h2>
                <p className="rp-muted">عرض جميع مستخدمي المركز الرئيسي والفروع والمستأجرين مع إجراءات العرض والتعديل والحذف والإضافة</p>
              </div>
              <button type="button" className="rp-btn-primary" onClick={openCreateUser}>
                <i className="fas fa-user-plus" /> إضافة مستخدم
              </button>
            </div>
            <div className="rp-filters">
              <div className="grow">
                <label>بحث</label>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو البريد أو الجهة أو رقم الكيان أو رابط المستأجر"
                />
              </div>
              <div>
                <label>الحالة</label>
                <select value={userStatus} onChange={(e) => setUserStatus(e.target.value)}>
                  <option value="">الكل</option>
                  <option value="true">نشط</option>
                  <option value="false">غير نشط</option>
                </select>
              </div>
            </div>
            <div className="rp-muted" style={{ marginBottom: 12 }}>
              إجمالي المستخدمين: {filteredUsers.length}
            </div>
            <div className="rp-table-wrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الاسم</th>
                    <th>البريد</th>
                    <th>نوع الحساب</th>
                    <th>الجهة</th>
                    <th>الدور الحالي</th>
                    <th className="center">الحالة</th>
                    <th className="center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className={selectedUserId === u.id ? "selected" : ""}>
                      <td>{u.id}</td>
                      <td className="strong">{u.name}</td>
                      <td>{u.email}</td>
                      <td>{ACCOUNT_TYPE_LABELS[u.account_type] ?? u.account_type}</td>
                      <td>{u.entity_name}</td>
                      <td className="mono">{u.role_code ?? "—"}</td>
                      <td className="center">
                        <span className={`badge ${u.is_active ? "green" : "red"}`}>
                          {u.is_active ? "نشط" : "غير نشط"}
                        </span>
                      </td>
                      <td className="center actions">
                        <RowActions
                          iconSet="fa"
                          style={{ justifyContent: "center" }}
                          actions={standardRowActions({
                            onView: () => selectUser(u.id),
                            onEdit: () => openEditUser(u.id),
                            onDelete: () => deleteUser(u.id),
                          })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rp-card pad">
            <div className="rp-center-block">
              <h2>تفاصيل المستخدم وتعيين الدور</h2>
              <p>اختر مستخدماً من الجدول أو أدخل رقمه لتحديث صلاحياته</p>
              <div className="rp-grid-2">
                <div>
                  <label>معرف المستخدم</label>
                  <div className="rp-inline">
                    <input
                      type="number"
                      value={selectedUserId ?? ""}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        if (id) selectUser(id);
                        else setSelectedUserId(null);
                      }}
                      placeholder="ID"
                    />
                    <button type="button" className="rp-btn-ghost" onClick={() => selectedUserId && selectUser(selectedUserId)}>
                      <i className="fas fa-search" />
                    </button>
                  </div>
                </div>
                <div>
                  <label>الدور الجديد</label>
                  <select value={assignRoleCode} onChange={(e) => setAssignRoleCode(e.target.value)}>
                    <option value="">-- اختر دوراً --</option>
                    {roles.filter((r) => r.is_active).map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.title_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedUser && (
                <div className="rp-user-info">
                  <h3>
                    <i className="fas fa-info-circle" /> معلومات المستخدم
                  </h3>
                  <div className="rp-info-grid">
                    <div><span>الاسم</span><b>{selectedUser.name}</b></div>
                    <div><span>البريد</span><b>{selectedUser.email}</b></div>
                    <div><span>الجهة</span><b>{selectedUser.entity_name}</b></div>
                    <div><span>الحالة</span><b>{selectedUser.is_active ? "نشط" : "غير نشط"}</b></div>
                    <div><span>نوع الحساب</span><b>{ACCOUNT_TYPE_LABELS[selectedUser.account_type]}</b></div>
                    <div><span>المسمى المسجل</span><b>{selectedUser.job_title}</b></div>
                    <div className="span2">
                      <span>الدور الحالي</span>
                      <b className="role-hl">{selectedUser.role_code ?? "بدون دور"}</b>
                    </div>
                  </div>
                </div>
              )}
              <div className="rp-inline-btns">
                <button type="button" className="rp-btn-success" onClick={assignRole}>
                  <i className="fas fa-check-circle" /> تعيين الدور
                </button>
                <button type="button" className="rp-btn-danger-outline" onClick={revokeRole}>
                  <i className="fas fa-ban" /> إلغاء الدور
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="rp-card">
          <div className="rp-card-head">
            <h2 className="rp-h2">سجل العمليات</h2>
          </div>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>النوع</th>
                  <th>المعرف</th>
                  <th>العملية</th>
                  <th>نفذ بواسطة</th>
                </tr>
              </thead>
              <tbody>
                {store.audit.map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{a.date}</td>
                    <td><span className="badge slate">{a.type}</span></td>
                    <td className="mono">{a.entity_id}</td>
                    <td>{a.action}</td>
                    <td>{a.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "office" && (
        <div className="rp-card pad">
          <div className="rp-center-block">
            <h2>صلاحيات صفحات المكاتب</h2>
            <p>حدد الصفحات المتاحة لكل مكتب فرعي</p>
            <div className="rp-soft-box">
              <label>معرف / كود المكتب</label>
              <div className="rp-inline">
                <input
                  value={officeId}
                  onChange={(e) => setOfficeId(e.target.value)}
                  onBlur={loadOffice}
                  placeholder="مثال: 97 أو OF-MAA"
                />
                <button type="button" className="rp-btn-ghost" onClick={loadOffice}>
                  تحميل
                </button>
              </div>
            </div>
            {officeInfo && (
              <>
                <div className="rp-office-info">
                  <div><span>اسم المكتب</span><b>{officeInfo.name}</b></div>
                  <div><span>الكود</span><b>{officeInfo.code}</b></div>
                  <div className="span2">
                    <span>الصفحات المحددة</span>
                    <b className="role-hl">
                      {officePages.length
                        ? OFFICE_PAGES.filter((p) => officePages.includes(p.key)).map((p) => p.label).join("، ")
                        : "لا توجد صفحات محددة"}
                    </b>
                  </div>
                </div>
                <div className="rp-dropdown-wrap">
                  <button type="button" className="rp-dropdown-toggle" onClick={() => setOfficeOpen((v) => !v)}>
                    <span>
                      {officePages.length ? `تم اختيار ${officePages.length} صفحة` : "اختر الصفحات"}
                    </span>
                    <i className={`fas fa-chevron-${officeOpen ? "up" : "down"}`} />
                  </button>
                  {officeOpen && (
                    <div className="rp-dropdown">
                      {OFFICE_PAGES.map((p) => (
                        <label key={p.key}>
                          <input
                            type="checkbox"
                            checked={officePages.includes(p.key)}
                            onChange={(e) => {
                              setOfficePages((prev) =>
                                e.target.checked ? [...prev, p.key] : prev.filter((k) => k !== p.key),
                              );
                            }}
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rp-save-row">
                  <button type="button" className="rp-btn-primary" onClick={saveOffice}>
                    <i className="fas fa-save" /> حفظ صلاحيات المكتب
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "tenant" && (
        <div className="rp-card pad">
          <div className="rp-center-block wide">
            <h2>صلاحيات المستأجرين</h2>
            <p>تحكم في الأنظمة والصفحات المتاحة لكل مستأجر / كيان</p>
            <div className="rp-soft-box">
              <label>معرف المستأجر / النطاق</label>
              <div className="rp-inline">
                <input
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  onBlur={loadTenant}
                  placeholder="مثال: moka.naiosherp.com أو TEN000123"
                />
                <button type="button" className="rp-btn-ghost" onClick={loadTenant}>
                  تحميل
                </button>
              </div>
            </div>
            {tenantInfo && (
              <>
                <div className="rp-tenant-info">
                  <div><span>اسم المستأجر</span><b>{tenantInfo.name}</b></div>
                  <div><span>الرابط / النطاق الفرعي</span><b>{tenantInfo.subdomain}</b></div>
                  <div><span>entity_id</span><b>{tenantInfo.entity_id}</b></div>
                  <div className="span2">
                    <span>الصفحات / الأنظمة</span>
                    <b className="role-hl">{tenantSystems.length} نظام — {tenantPages.length} صفحة</b>
                  </div>
                </div>
                <div className="rp-tenant-grid">
                  {TENANT_SYSTEMS.map((sys) => {
                    const on = tenantSystems.includes(sys.key);
                    return (
                      <div key={sys.key} className={`rp-tenant-card ${on ? "on" : ""}`}>
                        <label className="rp-tenant-sys">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTenantSystems((p) => [...p, sys.key]);
                                setTenantPages((p) => Array.from(new Set([...p, ...sys.pages.map((x) => x.key)])));
                              } else {
                                setTenantSystems((p) => p.filter((k) => k !== sys.key));
                                const keys = new Set(sys.pages.map((x) => x.key));
                                setTenantPages((p) => p.filter((k) => !keys.has(k)));
                              }
                            }}
                          />
                          <strong>{sys.label}</strong>
                        </label>
                        {on && (
                          <div className="rp-tenant-pages">
                            {sys.pages.map((p) => (
                              <label key={p.key}>
                                <input
                                  type="checkbox"
                                  checked={tenantPages.includes(p.key)}
                                  onChange={(e) => {
                                    setTenantPages((prev) =>
                                      e.target.checked ? [...prev, p.key] : prev.filter((k) => k !== p.key),
                                    );
                                  }}
                                />
                                {p.label}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="rp-save-row">
                  <button type="button" className="rp-btn-primary" onClick={saveTenant}>
                    <i className="fas fa-save" /> حفظ صلاحيات المستأجر
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "accountTypeSidebar" && (
        <div className="rp-card pad">
          <div className="rp-center-block">
            <h2>القائمة الجانبية حسب نوع الحساب</h2>
            <p>حدد تبويبات القائمة الظاهرة لكل نوع حساب</p>
            <div className="rp-soft-box">
              <label>نوع الحساب</label>
              <select
                value={accountType}
                onChange={(e) => loadSidebar(e.target.value)}
              >
                <option value="">-- اختر نوع الحساب --</option>
                {ACCOUNT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {accountType && (
              <>
                <div className="rp-ats-badge">
                  محدد: {sidebarPages.length} / {OFFICE_PAGES.length} صفحة — {ACCOUNT_TYPE_LABELS[accountType]}
                </div>
                <div className="rp-ats-actions">
                  <button
                    type="button"
                    className="rp-btn-ghost"
                    onClick={() => setSidebarPages(OFFICE_PAGES.map((p) => p.key))}
                  >
                    تحديد الكل
                  </button>
                  <button type="button" className="rp-btn-ghost" onClick={() => setSidebarPages([])}>
                    إلغاء الكل
                  </button>
                </div>
                <div className="rp-ats-grid">
                  {OFFICE_PAGES.map((p) => (
                    <label key={p.key}>
                      <input
                        type="checkbox"
                        checked={sidebarPages.includes(p.key)}
                        onChange={(e) => {
                          setSidebarPages((prev) =>
                            e.target.checked ? [...prev, p.key] : prev.filter((k) => k !== p.key),
                          );
                        }}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
                <div className="rp-save-row">
                  <button type="button" className="rp-btn-primary" onClick={saveSidebar}>
                    <i className="fas fa-save" /> حفظ القائمة الجانبية
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {(roleModal || userModal) && (
        <div className="rp-modal-backdrop" onClick={() => { setRoleModal(null); setUserModal(null); }}>
          <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
            {roleModal && (
              <>
                <div className="rp-modal-head">
                  <h3>{roleModal === "create" ? "إنشاء دور جديد" : "تعديل الدور"}</h3>
                  <button type="button" onClick={() => setRoleModal(null)}>
                    <i className="fas fa-times" />
                  </button>
                </div>
                <div className="rp-modal-body">
                  {roleModal === "edit" ? (
                    <div className="rp-code-locked">
                      <span className="mono">{editingRoleCode}</span>
                      <span>رمز الدور لا يمكن تغييره</span>
                    </div>
                  ) : (
                    <div className="field full">
                      <label>رمز الدور (Code)</label>
                      <input
                        value={roleForm.code}
                        onChange={(e) => setRoleForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                        placeholder="مثال: HR_MANAGER"
                        className="mono"
                      />
                      <small>يجب أن يكون بالإنجليزية وحروف كبيرة</small>
                    </div>
                  )}
                  <div className="rp-form-grid">
                    <div className="field">
                      <label>الاسم (عربي)</label>
                      <input
                        value={roleForm.title_ar}
                        onChange={(e) => setRoleForm((f) => ({ ...f, title_ar: e.target.value }))}
                        placeholder="مدير الموارد البشرية"
                      />
                    </div>
                    <div className="field">
                      <label>الاسم (انجليزي)</label>
                      <input
                        value={roleForm.title_en}
                        onChange={(e) => setRoleForm((f) => ({ ...f, title_en: e.target.value }))}
                        placeholder="HR Manager"
                      />
                    </div>
                    <div className="field full">
                      <label>الوصف</label>
                      <textarea
                        rows={2}
                        value={roleForm.description}
                        onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label>المستوى الهرمي</label>
                      <select
                        value={roleForm.hierarchy_level}
                        onChange={(e) =>
                          setRoleForm((f) => ({ ...f, hierarchy_level: Number(e.target.value) }))
                        }
                      >
                        {HIERARCHY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>الحد الأقصى للموافقة</label>
                      <input
                        type="number"
                        min={0}
                        value={roleForm.max_approval_limit}
                        onChange={(e) =>
                          setRoleForm((f) => ({ ...f, max_approval_limit: Number(e.target.value) }))
                        }
                      />
                    </div>
                    {roleModal === "edit" && (
                      <div className="field">
                        <label>الحالة</label>
                        <select
                          value={roleForm.is_active ? "1" : "0"}
                          onChange={(e) =>
                            setRoleForm((f) => ({ ...f, is_active: e.target.value === "1" }))
                          }
                        >
                          <option value="1">نشط</option>
                          <option value="0">غير نشط</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rp-modal-foot">
                  <button type="button" className="rp-btn-ghost" onClick={() => setRoleModal(null)}>
                    إلغاء
                  </button>
                  <button type="button" className="rp-btn-primary" onClick={saveRole}>
                    {roleModal === "create" ? "إنشاء الدور" : "حفظ التعديلات"}
                  </button>
                </div>
              </>
            )}

            {userModal && (
              <>
                <div className="rp-modal-head">
                  <div>
                    <h3>{userModal === "create" ? "إضافة مستخدم" : "تعديل مستخدم"}</h3>
                    <p>إدارة بيانات المستخدم الأساسية قبل تعيين الصلاحيات</p>
                  </div>
                  <button type="button" onClick={() => setUserModal(null)}>
                    <i className="fas fa-times" />
                  </button>
                </div>
                <div className="rp-modal-body">
                  <div className="rp-form-grid">
                    <div className="field">
                      <label>الاسم</label>
                      <input
                        value={userForm.name}
                        onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label>البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label>
                        كلمة المرور{" "}
                        <span className="hint">
                          {userModal === "create" ? "(مطلوبة عند الإضافة)" : "(اتركها فارغة للإبقاء)"}
                        </span>
                      </label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label>نوع الحساب</label>
                      <select
                        value={userForm.account_type}
                        onChange={(e) => setUserForm((f) => ({ ...f, account_type: e.target.value }))}
                      >
                        {ACCOUNT_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>رقم الكيان</label>
                      <input
                        value={userForm.entity_id}
                        onChange={(e) => setUserForm((f) => ({ ...f, entity_id: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label>اسم الجهة</label>
                      <input
                        value={userForm.entity_name}
                        onChange={(e) => setUserForm((f) => ({ ...f, entity_name: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label>المسمى الوظيفي</label>
                      <input
                        value={userForm.job_title}
                        onChange={(e) => setUserForm((f) => ({ ...f, job_title: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label>الحالة</label>
                      <select
                        value={userForm.is_active ? "1" : "0"}
                        onChange={(e) =>
                          setUserForm((f) => ({ ...f, is_active: e.target.value === "1" }))
                        }
                      >
                        <option value="1">نشط</option>
                        <option value="0">غير نشط</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="rp-modal-foot">
                  <button type="button" className="rp-btn-ghost" onClick={() => setUserModal(null)}>
                    إلغاء
                  </button>
                  <button type="button" className="rp-btn-primary" onClick={saveUser}>
                    حفظ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div id="toast" className={`show ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );

  if (embedded) return content;
  return <AppShell>{content}</AppShell>;
}

const RP_CSS = `
  .rp-page {
    --brand: #c3152a;
    font-family: var(--font-cairo), 'Cairo', sans-serif;
    direction: rtl;
    color: #1e293b;
    padding: 0 0 2rem;
  }
  .rp-header {
    display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem;
    align-items: flex-start; margin-bottom: 1.5rem;
  }
  .rp-title { font-size: 1.35rem; font-weight: 800; margin: 0 0 .25rem; }
  .rp-sub { margin: 0; color: #64748b; font-size: .875rem; }
  .rp-header-actions { display: flex; gap: .6rem; flex-wrap: wrap; }
  .rp-btn-primary, .rp-btn-ghost, .rp-btn-success, .rp-btn-danger-outline {
    border-radius: 10px; padding: .65rem 1.1rem; font-weight: 700; font-size: .875rem;
    display: inline-flex; align-items: center; gap: .45rem; cursor: pointer; border: none;
  }
  .rp-btn-primary { background: var(--brand); color: #fff; box-shadow: 0 6px 16px rgba(195,21,42,.22); }
  .rp-btn-primary:hover { filter: brightness(.95); }
  .rp-btn-primary.lg { padding: .85rem 1.6rem; }
  .rp-btn-ghost { background: #fff; border: 1px solid #e2e8f0; color: #475569; }
  .rp-btn-success { background: #16a34a; color: #fff; flex: 1; justify-content: center; padding: .85rem; }
  .rp-btn-danger-outline { background: #fff; border: 1px solid #fecaca; color: #dc2626; flex: 1; justify-content: center; padding: .85rem; }
  .rp-kpis {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem;
  }
  @media (max-width: 1100px) { .rp-kpis { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { .rp-kpis { grid-template-columns: 1fr; } }
  .rp-kpi {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.15rem 1.25rem;
    display: flex; justify-content: space-between; align-items: center;
    box-shadow: 0 1px 3px rgba(0,0,0,.05);
  }
  .rp-kpi p { margin: 0 0 .2rem; font-size: .8rem; color: #64748b; font-weight: 600; }
  .rp-kpi h3 { margin: 0; font-size: 1.75rem; font-weight: 800; }
  .rp-kpi-ico {
    width: 48px; height: 48px; border-radius: 10px; display: grid; place-items: center; font-size: 1.1rem;
  }
  .rp-kpi-btn { cursor: pointer; text-align: right; width: 100%; font: inherit; }
  .rp-tabs-wrap {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 1.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,.05);
  }
  .rp-banner {
    background: #eff6ff; border-bottom: 1px solid #dbeafe; padding: .55rem 1rem;
    display: flex; flex-wrap: wrap; gap: .6rem; justify-content: space-between; align-items: center;
    font-size: .75rem; color: #1d4ed8; font-weight: 700;
  }
  .rp-banner-links { display: flex; gap: .4rem; flex-wrap: wrap; }
  .rp-chip {
    display: inline-flex; align-items: center; gap: .35rem; border-radius: 999px;
    padding: .25rem .7rem; color: #fff; text-decoration: none; font-weight: 700;
  }
  .rp-chip.blue { background: #2563eb; }
  .rp-tabs { display: flex; overflow-x: auto; border-bottom: 1px solid #f1f5f9; }
  .rp-tab {
    white-space: nowrap; padding: 1rem 1.25rem; background: transparent; border: none;
    border-bottom: 2px solid transparent; color: #64748b; font-weight: 600; font-size: .875rem;
    cursor: pointer; display: inline-flex; align-items: center; gap: .4rem;
  }
  .rp-tab:hover { background: #f8fafc; color: var(--brand); }
  .rp-tab.active { color: var(--brand); border-bottom-color: var(--brand); font-weight: 800; }
  .rp-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,.05); margin-bottom: 1rem;
  }
  .rp-card.pad { padding: 1.35rem; }
  .rp-card-head { padding: 1.15rem 1.35rem; border-bottom: 1px solid #f1f5f9; }
  .rp-stack { display: flex; flex-direction: column; gap: 1rem; }
  .rp-toolbar {
    display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: center;
    padding: 1.15rem 1.35rem; border-bottom: 1px solid #f1f5f9;
  }
  .rp-card.pad > .rp-toolbar { padding: 0 0 1rem; border-bottom: none; }
  .rp-search { position: relative; width: min(100%, 24rem); }
  .rp-search i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
  .rp-search input, .rp-filters input, .rp-filters select, .rp-soft-box select, .rp-soft-box input,
  .rp-grid-2 input, .rp-grid-2 select, .rp-form-grid input, .rp-form-grid select, .rp-form-grid textarea,
  .rp-perm-card select, .rp-inline input {
    width: 100%; padding: .7rem .9rem; border: 1px solid #e2e8f0; border-radius: 10px;
    font: inherit; background: #fff; color: #0f172a;
  }
  .rp-search input { padding-left: 2.2rem; }
  .rp-table-wrap { overflow-x: auto; }
  .rp-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
  .rp-table th {
    background: #f8fafc; color: #475569; font-weight: 700; text-align: right;
    padding: .9rem 1.1rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap;
  }
  .rp-table td { padding: .9rem 1.1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .rp-table tr:hover td { background: #f8fafc; }
  .rp-table tr.selected td { background: #fff1f2; }
  .rp-table .center { text-align: center; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .78rem; font-weight: 700; color: #64748b; }
  .strong { font-weight: 700; color: #0f172a; }
  .badge {
    display: inline-flex; align-items: center; padding: .15rem .55rem; border-radius: 999px;
    font-size: .72rem; font-weight: 700;
  }
  .badge.green { background: #dcfce7; color: #166534; }
  .badge.red { background: #fee2e2; color: #991b1b; }
  .badge.slate { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
  .count {
    display: inline-flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: 999px; font-size: .72rem; font-weight: 800;
  }
  .count.blue { background: #eff6ff; color: #2563eb; }
  .count.green { background: #ecfdf5; color: #059669; }
  .icon-btn {
    background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: .35rem; font-size: .95rem;
  }
  .icon-btn:hover { color: var(--brand); }
  .icon-btn.danger:hover { color: #dc2626; }
  .rp-center-block { max-width: 48rem; margin: 0 auto; text-align: center; }
  .rp-center-block.wide { max-width: 56rem; }
  .rp-center-block h2, .rp-h2 { margin: 0 0 .35rem; font-size: 1.35rem; font-weight: 800; }
  .rp-center-block > p, .rp-muted { color: #64748b; margin: 0 0 1rem; font-size: .9rem; }
  .rp-soft-box {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.1rem; margin-bottom: 1.25rem; text-align: right;
  }
  .rp-soft-box label, .rp-filters label, .rp-grid-2 label, .field label {
    display: block; font-size: .8rem; font-weight: 700; color: #334155; margin-bottom: .4rem; text-align: right;
  }
  .rp-perm-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: .85rem; margin-bottom: 1.25rem; text-align: right;
  }
  @media (max-width: 700px) { .rp-perm-grid { grid-template-columns: 1fr; } }
  .rp-perm-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; background: #fff; }
  .rp-perm-card.perm-full { border-color: #fecaca; background: #fef2f2; }
  .rp-perm-card.perm-partial { border-color: #bfdbfe; background: #eff6ff; }
  .rp-perm-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: .65rem; }
  .rp-perm-head h4 { margin: 0; font-size: .95rem; }
  .rp-perm-head i { color: #94a3b8; }
  .rp-save-row { display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
  .rp-filters { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1rem; text-align: right; }
  @media (max-width: 700px) { .rp-filters { grid-template-columns: 1fr; } }
  .rp-filters .grow { min-width: 0; }
  .mini {
    border: none; border-radius: 8px; padding: .35rem .55rem; font-size: .72rem; font-weight: 700; cursor: pointer; margin: 0 2px;
  }
  .mini.blue { background: #e0f2fe; color: #0369a1; }
  .mini.amber { background: #ffedd5; color: #c2410c; }
  .mini.red { background: #fee2e2; color: #b91c1c; }
  .actions { white-space: nowrap; }
  .rp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: right; margin-bottom: 1rem; }
  @media (max-width: 700px) { .rp-grid-2 { grid-template-columns: 1fr; } }
  .rp-inline { display: flex; gap: .5rem; }
  .rp-user-info, .rp-office-info, .rp-tenant-info {
    background: #eff6ff; border: 1px solid #dbeafe; border-radius: 14px; padding: 1.1rem; margin-bottom: 1rem; text-align: right;
  }
  .rp-office-info { background: #ecfdf5; border-color: #a7f3d0; }
  .rp-tenant-info { background: #f0f9ff; border-color: #bae6fd; }
  .rp-user-info h3 { margin: 0 0 .85rem; color: #1e40af; font-size: .95rem; display: flex; gap: .4rem; align-items: center; }
  .rp-info-grid, .rp-office-info, .rp-tenant-info {
    display: grid; grid-template-columns: 1fr 1fr; gap: .75rem;
  }
  .rp-info-grid span, .rp-office-info span, .rp-tenant-info span {
    display: block; font-size: .7rem; color: #3b82f6; font-weight: 600;
  }
  .rp-office-info span { color: #059669; }
  .rp-tenant-info span { color: #0284c7; }
  .rp-info-grid b, .rp-office-info b, .rp-tenant-info b { font-weight: 700; color: #334155; }
  .span2 { grid-column: 1 / -1; border-top: 1px solid rgba(59,130,246,.2); padding-top: .65rem; margin-top: .15rem; }
  .role-hl { color: var(--brand) !important; font-size: 1.05rem; }
  .rp-inline-btns { display: flex; gap: .75rem; }
  .rp-dropdown-wrap { position: relative; text-align: right; margin-bottom: 1rem; }
  .rp-dropdown-toggle {
    width: 100%; padding: .75rem 1rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff;
    display: flex; justify-content: space-between; align-items: center; cursor: pointer; font: inherit;
  }
  .rp-dropdown {
    position: absolute; z-index: 20; inset-inline: 0; top: calc(100% + 6px); max-height: 16rem; overflow: auto;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.08); padding: .75rem;
  }
  .rp-dropdown label, .rp-ats-grid label, .rp-tenant-pages label {
    display: flex; align-items: center; gap: .5rem; padding: .35rem .2rem; font-size: .85rem; cursor: pointer;
  }
  .rp-tenant-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .85rem; text-align: right; margin-bottom: 1rem; }
  @media (max-width: 800px) { .rp-tenant-grid { grid-template-columns: 1fr; } }
  .rp-tenant-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: .85rem; background: #f8fafc; }
  .rp-tenant-card.on { background: #fff; border-color: #93c5fd; }
  .rp-tenant-sys { display: flex; gap: .5rem; align-items: center; margin-bottom: .5rem; font-weight: 700; }
  .rp-tenant-pages { display: grid; gap: .2rem; padding-right: 1.4rem; }
  .rp-ats-badge {
    display: inline-flex; align-items: center; min-height: 48px; padding: 0 .9rem; border-radius: 10px;
    background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; font-size: .85rem; margin-bottom: .75rem;
  }
  .rp-ats-actions { display: flex; gap: .5rem; justify-content: flex-start; margin-bottom: .75rem; }
  .rp-ats-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: .35rem; max-height: 24rem; overflow: auto;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; text-align: right; margin-bottom: 1rem;
  }
  @media (max-width: 700px) { .rp-ats-grid { grid-template-columns: 1fr; } }
  .rp-modal-backdrop {
    position: fixed; inset: 0; z-index: 80; background: rgba(15,23,42,.55); backdrop-filter: blur(4px);
    display: grid; place-items: center; padding: 1rem;
  }
  .rp-modal {
    background: #fff; width: min(640px, 100%); border-radius: 18px; max-height: 90vh; overflow: hidden;
    display: flex; flex-direction: column; box-shadow: 0 25px 60px rgba(0,0,0,.25);
  }
  .rp-modal-head {
    padding: 1.15rem 1.35rem; border-bottom: 1px solid #f1f5f9;
    display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;
  }
  .rp-modal-head h3 { margin: 0; font-size: 1.1rem; font-weight: 800; }
  .rp-modal-head p { margin: .25rem 0 0; color: #64748b; font-size: .8rem; }
  .rp-modal-head button { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1rem; }
  .rp-modal-body { padding: 1.2rem 1.35rem; overflow: auto; }
  .rp-modal-foot {
    padding: 1rem 1.35rem; border-top: 1px solid #f1f5f9; background: #f8fafc;
    display: flex; justify-content: flex-end; gap: .6rem;
  }
  .rp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }
  .field.full, .rp-form-grid .full { grid-column: 1 / -1; }
  .field small, .hint { color: #94a3b8; font-size: .72rem; font-weight: 500; }
  .rp-code-locked {
    display: flex; align-items: center; gap: .75rem; background: #eff6ff; border-radius: 10px;
    padding: .75rem 1rem; margin-bottom: 1rem; color: #1d4ed8; font-size: .85rem;
  }
  .rp-code-locked .mono {
    background: #dbeafe; color: #1e40af; padding: .35rem .55rem; border-radius: 6px;
  }
  #toast {
    position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%) translateY(80px);
    background: #1e293b; color: #fff; padding: .6rem 1.4rem; border-radius: 100px;
    font-size: .875rem; font-weight: 700; z-index: 9999; transition: transform .3s ease; pointer-events: none;
  }
  #toast.show { transform: translateX(-50%) translateY(0); }
  #toast.success { background: #059669; }
  #toast.error { background: #dc2626; }
`;
