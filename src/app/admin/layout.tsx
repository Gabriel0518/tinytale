"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { AdminI18nProvider, translateAdminText, useAdminLocale } from "@/lib/admin-i18n";

const pageTitles: Record<string, string> = {
  "/admin": "Overview",
  "/admin/banners": "Banners",
  "/admin/hero-banners": "Hero Banners",
  "/admin/dramas": "Dramas",
  "/admin/categories": "Categories",
  "/admin/rankings": "Rankings",
  "/admin/comments": "Comments",
  "/admin/users": "Users",
  "/admin/orders": "Orders",
  "/admin/subscriptions": "Subscriptions",
  "/admin/coin-records": "Coin Records",
  "/admin/finance": "Finance",
  "/admin/promoters": "Promoters",
  "/admin/creators": "Creator Dashboard",
  "/admin/creators/dashboard": "Creator Dashboard",
  "/admin/creators/applications": "Creator Applications",
  "/admin/creators/list": "Creator List",
  "/admin/creators/content": "Creator Content Review",
  "/admin/creators/dmca": "Creator DMCA",
  "/admin/creators/revenue": "Creator Revenue",
  "/admin/creators/bank-accounts": "Creator Bank Accounts",
  "/admin/creators/payout-requests": "Creator Payout Requests",
  "/admin/creators/settlements": "Creator Settlements",
  "/admin/creators/policies": "Creator Policies",
  "/admin/creators/tickets": "Creator Tickets",
  "/admin/withdrawals": "Withdrawals",
  "/admin/checkin": "Daily Check-in",
  "/admin/tasks": "Tasks",
  "/admin/campaigns": "Campaigns",
  "/admin/admins": "Admins",
  "/admin/settings/admin": "Admins",
  "/admin/settings/admins": "Admins",
  "/admin/roles": "Roles",
  "/admin/settings": "Settings",
  "/admin/settings/help-center": "Information & Help Center",
  "/admin/logs": "Audit Logs",
};

function resolveAdminPageTitle(pathname: string | null): string {
  if (!pathname) return "Admin";
  if (pageTitles[pathname]) return pageTitles[pathname];

  if (pathname.startsWith("/admin/dramas/") && pathname.endsWith("/episodes")) {
    return "Manage Episodes";
  }
  if (pathname.startsWith("/admin/dramas/")) {
    return "Drama Management";
  }
  if (pathname.startsWith("/admin/users/")) {
    return "Users";
  }
  if (pathname.startsWith("/admin/orders/")) {
    return "Orders";
  }
  if (pathname.startsWith("/admin/promoters/settings")) {
    return "Promoters";
  }
  if (pathname.startsWith("/admin/promoters/")) {
    return "Promoters";
  }
  if (pathname.startsWith("/admin/creators/applications/")) {
    return "Creator Applications";
  }
  if (pathname.startsWith("/admin/creators/content/")) {
    return "Creator Content Review";
  }
  if (pathname.startsWith("/admin/creators/")) {
    return "Creator Dashboard";
  }

  return "Admin";
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.tinytale.top";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useAdminLocale();
  const [authChecked, setAuthChecked] = useState(false);

  // Login page and create-drama wizard render without sidebar/header and skip auth
  const skipAuth = pathname === "/admin/login" || pathname === "/admin/dramas/create";

  useEffect(() => {
    if (skipAuth) {
      setAuthChecked(true);
      return;
    }

    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    // Validate token against backend
    fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-user-lang": locale,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        if (data.data?.role !== "admin" && data.data?.user?.role !== "admin") {
          localStorage.removeItem("admin_token");
          router.replace("/admin/login");
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => {
        localStorage.removeItem("admin_token");
        router.replace("/admin/login");
      });
  }, [locale, pathname, router, skipAuth]);

  if (skipAuth) {
    return <div data-admin-i18n-root>{children}</div>;
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#13131d]">
        <div className="text-gray-400 text-sm">{translateAdminText("Verifying authentication...", locale)}</div>
      </div>
    );
  }

  const title = translateAdminText(resolveAdminPageTitle(pathname), locale);

  return (
    <div data-admin-i18n-root className="min-h-screen bg-[#13131d]">
      <AdminSidebar />
      <div className="ml-60">
        <AdminHeader title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminI18nProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminI18nProvider>
  );
}
