"use client";

import { usePathname } from "next/navigation";
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
  "/admin/roles": "Roles",
  "/admin/settings": "Settings",
  "/admin/logs": "Audit Logs",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page and create-drama wizard render without sidebar/header
  if (pathname === "/admin/login" || pathname === "/admin/dramas/create") {
    return <>{children}</>;
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
