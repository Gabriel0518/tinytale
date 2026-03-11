import { redirect } from "next/navigation";

export default function AdminSettingsAdminRedirectPage() {
  redirect("/admin/admins");
}
