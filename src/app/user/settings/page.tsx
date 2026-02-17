"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { profileApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { ArrowLeft, Camera, Eye, EyeOff, LogOut, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { user, token, logout, updateUser } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveProfile = async () => {
    if (!token || !user) return;
    setSaving(true);
    setMessage(null);
    try {
      const res: any = await profileApi.update(token, { nickname });
      if (res.data) updateUser({ ...user, nickname });
      setMessage({ type: "success", text: "Profile updated" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      await profileApi.changePassword(token, oldPassword, newPassword);
      setMessage({ type: "success", text: "Password changed" });
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to change password" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 pt-20 pb-12">
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="mb-8 text-2xl font-bold text-white">Account Settings</h1>

        {message && (
          <div className={`mb-6 rounded-lg p-3 text-sm ${message.type === "success" ? "bg-accent-success/20 text-accent-success" : "bg-accent-error/20 text-accent-error"}`}>
            {message.text}
          </div>
        )}

        {/* Avatar */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-text-secondary uppercase tracking-wider">Profile Photo</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-elevated text-2xl font-bold text-white">
                {user.nickname?.charAt(0).toUpperCase() || "U"}
              </div>
              <button className="absolute -bottom-1 -right-1 rounded-full bg-accent-primary p-1.5 text-white hover:bg-red-700">
                <Camera size={14} />
              </button>
            </div>
            <div>
              <p className="text-sm text-text-secondary">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>
        </section>

        {/* Profile Info */}
        <section className="mb-8 rounded-xl bg-bg-secondary p-6">
          <h2 className="mb-4 text-sm font-medium text-text-secondary uppercase tracking-wider">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-bg-elevated px-4 py-2.5 text-white focus:border-accent-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-lg border border-white/10 bg-bg-elevated px-4 py-2.5 text-text-tertiary cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving || nickname === user.nickname}
              className="rounded-lg bg-accent-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>

        {/* Password */}
        <section className="mb-8 rounded-xl bg-bg-secondary p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Password</h2>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-sm text-accent-primary hover:underline"
            >
              {showPasswordForm ? "Cancel" : "Change Password"}
            </button>
          </div>
          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full rounded-lg border border-white/10 bg-bg-elevated px-4 py-2.5 pr-10 text-white focus:border-accent-primary focus:outline-none"
                  required
                />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  className="w-full rounded-lg border border-white/10 bg-bg-elevated px-4 py-2.5 pr-10 text-white focus:border-accent-primary focus:outline-none"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-accent-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </section>

        {/* Danger Zone */}
        <section className="space-y-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl bg-bg-secondary p-4 text-text-secondary transition hover:bg-bg-elevated hover:text-white"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Log Out</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl bg-bg-secondary p-4 text-accent-error/70 transition hover:bg-accent-error/10 hover:text-accent-error">
            <Trash2 size={18} />
            <span className="text-sm font-medium">Delete Account</span>
          </button>
        </section>
      </main>
    </div>
  );
}
