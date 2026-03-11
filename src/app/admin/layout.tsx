"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

const pageTitles: Record<string, string> = {
  "/admin": "Overview",
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7002";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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
      headers: { Authorization: `Bearer ${token}` },
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
  }, [pathname, router, skipAuth]);

  if (skipAuth) {
    return <>{children}</>;
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#13131d]">
        <div className="text-gray-400 text-sm">Verifying authentication...</div>
      </div>
    );
  }

  const title = pageTitles[pathname || ""] || "Admin";

  return (
    <div className="min-h-screen bg-[#13131d]">
      <AdminSidebar />
      <div className="ml-60">
        <AdminHeader title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
