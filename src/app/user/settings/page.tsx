"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { profileApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";

type Section = "profile" | "security" | "notifications" | "preferences";

const SIDEBAR_ITEMS: { id: Section | "history" | "purchases" | "logout"; label: string; icon: string }[] = [
  { id: "profile", label: "Profile Info", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
  { id: "security", label: "Security", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
  { id: "notifications", label: "Notifications", icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
  { id: "preferences", label: "Preferences", icon: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" },
  { id: "history", label: "Watch History", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "purchases", label: "Purchase History", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
  { id: "logout", label: "Sign Out", icon: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" },
];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${checked ? "bg-red-600" : "bg-gray-700"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { user, token, logout, updateUser } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const router = useRouter();
  const [section, setSection] = useState<Section>("profile");

  // Profile state
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Security state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessions, setSessions] = useState([
    { id: "sess_1", device: "Macbook Pro 16\"", location: "San Francisco, USA", browser: "Chrome", ip: "192.168.1.1", isCurrent: true, lastActive: "Active Now" },
    { id: "sess_2", device: "iPhone 14 Pro", location: "Los Angeles, USA", browser: "App", ip: "10.0.0.1", isCurrent: false, lastActive: "Active 2 hours ago" },
    { id: "sess_3", device: "iPad Air", location: "New York, USA", browser: "Safari", ip: "172.16.0.1", isCurrent: false, lastActive: "Active 3 days ago" },
  ]);
  const [googleConnected, setGoogleConnected] = useState("jane.c***@example.com");
  const [fbConnected, setFbConnected] = useState("");

  // Notifications state
  const [notifs, setNotifs] = useState({
    push: { newReleases: true, recommendations: true, accountActivity: true },
    email: { newsletter: false, promoOffers: true, weeklyDigests: false },
    inApp: { systemMessages: true },
  });

  // Preferences state
  const [autoplay, setAutoplay] = useState(true);
  const [videoQuality, setVideoQuality] = useState("auto");
  const [audioLang, setAudioLang] = useState("en");
  const [subtitleLang, setSubtitleLang] = useState("en");
  const [dataSaver, setDataSaver] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) setNickname(user.nickname || "");
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await profileApi.update(token, { nickname });
      updateUser({ ...user, nickname });
      toast("Profile updated successfully", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast(message || "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await profileApi.changePassword(token, oldPassword, newPassword);
      toast("Password changed successfully", "success");
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast(message || "Failed to change password", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSidebar = (id: string) => {
    if (id === "logout") { logout(); router.push("/"); return; }
    if (id === "history") { router.push("/user/history"); return; }
    if (id === "purchases") { router.push("/user/purchases"); return; }
    setSection(id as Section);
  };

  const isVip = user.vipStatus === "active";

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-2xl font-bold mb-8">Account Settings</h1>
        <div className="md:flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="w-56 shrink-0 hidden md:block">
            <div className="bg-zinc-900/60 rounded-xl border border-white/10 overflow-hidden">
              {SIDEBAR_ITEMS.map((item, i) => {
                const isActive = item.id === section && !["history", "purchases", "logout"].includes(item.id);
                const isLogout = item.id === "logout";
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSidebar(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-2 ${
                      isActive ? "border-red-500 bg-red-500/10 text-white" : "border-transparent hover:bg-white/5 text-gray-400 hover:text-white"
                    } ${isLogout ? "text-red-400 hover:text-red-300" : ""} ${i > 0 ? "border-t border-white/5" : ""}`}
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Sidebar - Mobile dropdown */}
          <div className="md:hidden w-full mb-4">
            <select
              value={section}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "logout") { logout(); router.push("/"); return; }
                if (val === "history") { router.push("/user/history"); return; }
                if (val === "purchases") { router.push("/user/purchases"); return; }
                setSection(val as Section);
              }}
              className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none appearance-none"
            >
              {SIDEBAR_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <main className="flex-1 min-w-0">

            {/* ===== PROFILE SECTION ===== */}
            {section === "profile" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
                  {/* Avatar */}
                  <div className="flex items-center gap-5 mb-8">
                    <div className="relative group">
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-2xl font-bold ${isVip ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-900" : ""}`}>
                        {user.nickname?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <button className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center" aria-label="Change avatar">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                      </button>
                    </div>
                    <div>
                      <p className="font-medium">{user.nickname}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      {isVip && <span className="inline-flex items-center gap-1 mt-1 text-xs text-yellow-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>VIP Member</span>}
                    </div>
                  </div>
                  {/* Form */}
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="settings-username" className="block text-sm text-gray-400 mb-1.5">Username</label>
                      <input id="settings-username" type="text" value={user.email?.split("@")[0] || ""} disabled className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                      <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                    </div>
                    <div>
                      <label htmlFor="settings-displayname" className="block text-sm text-gray-400 mb-1.5">Display Name</label>
                      <input id="settings-displayname" type="text" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={30} className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none transition" placeholder="Your display name" />
                    </div>
                    <div>
                      <label htmlFor="settings-email" className="block text-sm text-gray-400 mb-1.5">Email</label>
                      <div className="flex items-center gap-3">
                        <input id="settings-email" type="email" value={user.email || ""} disabled className="flex-1 bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                        <span className="flex items-center gap-1 text-xs text-green-400"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Verified</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="settings-bio" className="block text-sm text-gray-400 mb-1.5">Bio</label>
                      <textarea id="settings-bio" value={bio} onChange={e => setBio(e.target.value)} maxLength={200} rows={3} className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none transition resize-none" placeholder="Tell us about yourself..." />
                      <p className="text-xs text-gray-500 text-right">{bio.length}/200</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                    <button onClick={() => { setNickname(user.nickname || ""); setBio(""); }} className="px-5 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition">Cancel</button>
                    <button onClick={handleSaveProfile} disabled={saving} className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== SECURITY SECTION ===== */}
            {section === "security" && (
              <div className="space-y-6">
                {/* Password */}
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-1">Password</h2>
                  <p className="text-sm text-gray-400 mb-4">Last changed 3 months ago</p>
                  {!showPasswordForm ? (
                    <button onClick={() => setShowPasswordForm(true)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-sm transition">Change Password</button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      <div className="relative">
                        <input id="settings-current-password" type={showOld ? "text" : "password"} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Current password" required className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none pr-10" aria-label="Current password" />
                        <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label={showOld ? "Hide current password" : "Show current password"}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={showOld ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"} />{!showOld && <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}</svg>
                        </button>
                      </div>
                      <div className="relative">
                        <input id="settings-new-password" type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" required minLength={8} className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none pr-10" aria-label="New password" />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label={showNew ? "Hide new password" : "Show new password"}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={showNew ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"} />{!showNew && <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}</svg>
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition disabled:opacity-50">{saving ? "Updating..." : "Update Password"}</button>
                        <button type="button" onClick={() => { setShowPasswordForm(false); setOldPassword(""); setNewPassword(""); }} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Two-Factor */}
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                        <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full font-medium">Coming soon</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <Toggle checked={twoFactor} onChange={setTwoFactor} disabled />
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">Login Activity</h2>
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full font-medium">Coming soon</span>
                    </div>
                    <button onClick={() => setSessions(s => s.filter(x => x.isCurrent))} className="text-sm text-red-400 hover:text-red-300 transition">Sign out all other devices</button>
                  </div>
                  <div className="space-y-3">
                    {sessions.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={s.device.includes("iPhone") ? "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" : s.device.includes("iPad") ? "M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" : "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"} /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{s.device} · {s.browser}</p>
                            <p className="text-xs text-gray-400">{s.location} · {s.lastActive}</p>
                          </div>
                        </div>
                        {s.isCurrent ? (
                          <span className="text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">This device</span>
                        ) : (
                          <button onClick={() => setSessions(prev => prev.filter(x => x.id !== s.id))} className="text-sm text-red-400 hover:text-red-300 transition">Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Connected Accounts</h2>
                    <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full font-medium">Coming soon</span>
                  </div>
                  <div className="space-y-3 opacity-60 pointer-events-none">
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg></div>
                        <div>
                          <p className="text-sm font-medium">Google</p>
                          <p className="text-xs text-gray-400">{googleConnected || "Not connected"}</p>
                        </div>
                      </div>
                      <button className={`text-sm px-3 py-1.5 rounded-lg transition ${googleConnected ? "text-red-400 hover:text-red-300" : "bg-white/10 hover:bg-white/20 text-white"}`}>{googleConnected ? "Disconnect" : "Connect"}</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1877F2]/20 flex items-center justify-center"><svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>
                        <div>
                          <p className="text-sm font-medium">Facebook</p>
                          <p className="text-xs text-gray-400">{fbConnected || "Not connected"}</p>
                        </div>
                      </div>
                      <button className={`text-sm px-3 py-1.5 rounded-lg transition ${fbConnected ? "text-red-400 hover:text-red-300" : "bg-white/10 hover:bg-white/20 text-white"}`}>{fbConnected ? "Disconnect" : "Connect"}</button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone (inside Security) */}
                <div className="bg-zinc-900/60 rounded-xl border border-red-500/20 p-6">
                  <h2 className="text-lg font-semibold text-red-400 mb-1">Danger Zone</h2>
                  <p className="text-sm text-gray-400 mb-4">Permanently delete your account and all associated data</p>
                  <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-sm font-medium transition">Delete Account</button>
                </div>
              </div>
            )}

            {/* ===== NOTIFICATIONS SECTION ===== */}
            {section === "notifications" && (
              <div className="space-y-6">
                {/* Push Notifications */}
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-1">Push Notifications</h2>
                  <p className="text-sm text-gray-400 mb-5">Manage your mobile and desktop notifications</p>
                  <div className="space-y-4">
                    {([["newReleases", "New Releases", "Get notified when new episodes are available"], ["recommendations", "Recommendations", "Personalized drama suggestions based on your taste"], ["accountActivity", "Account Activity", "Login alerts and security notifications"]] as const).map(([key, label, desc]) => (
                      <div key={key} className="flex items-center justify-between py-2">
                        <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
                        <Toggle checked={notifs.push[key]} onChange={v => setNotifs(prev => ({ ...prev, push: { ...prev.push, [key]: v } }))} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Notifications */}
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-1">Email Notifications</h2>
                  <p className="text-sm text-gray-400 mb-5">Choose what emails you want to receive</p>
                  <div className="space-y-4">
                    {([["newsletter", "Newsletter", "Monthly updates and drama news"], ["promoOffers", "Promotional Offers", "Special deals and discount codes"], ["weeklyDigests", "Weekly Digests", "Summary of new content and trending dramas"]] as const).map(([key, label, desc]) => (
                      <div key={key} className="flex items-center justify-between py-2">
                        <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
                        <Toggle checked={notifs.email[key]} onChange={v => setNotifs(prev => ({ ...prev, email: { ...prev.email, [key]: v } }))} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* In-App */}
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-1">In-App Notifications</h2>
                  <p className="text-sm text-gray-400 mb-5">Notifications shown within the app</p>
                  <div className="flex items-center justify-between py-2">
                    <div><p className="text-sm font-medium">System Messages</p><p className="text-xs text-gray-400">Important system updates and announcements</p></div>
                    <Toggle checked={notifs.inApp.systemMessages} onChange={() => {}} disabled />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">System messages cannot be disabled</p>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => toast("Notification preferences saved", "success")} className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition">Save Preferences</button>
                </div>
              </div>
            )}

            {/* ===== PREFERENCES SECTION ===== */}
            {section === "preferences" && (
              <div className="space-y-6">
                {/* Playback */}
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-5">Playback</h2>
                  <div className="flex items-center justify-between mb-6">
                    <div><p className="text-sm font-medium">Autoplay Next Episode</p><p className="text-xs text-gray-400">Automatically play the next episode when one ends</p></div>
                    <Toggle checked={autoplay} onChange={setAutoplay} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Video Quality</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[["auto", "Auto", "Best quality for your connection"], ["1080p", "1080p HD", "High definition streaming"], ["720p", "720p", "Standard definition, saves data"]].map(([val, label, desc]) => (
                        <button key={val} onClick={() => setVideoQuality(val)} className={`p-4 rounded-xl border text-left transition ${videoQuality === val ? "border-red-500 bg-red-500/10" : "border-white/10 bg-zinc-800/50 hover:border-white/20"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{label}</p>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${videoQuality === val ? "border-red-500" : "border-gray-600"}`}>
                              {videoQuality === val && <div className="w-2 h-2 rounded-full bg-red-500" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Language */}
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-5">Language</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="settings-audio-lang" className="block text-sm text-gray-400 mb-1.5">Audio Language</label>
                      <select id="settings-audio-lang" value={audioLang} onChange={e => setAudioLang(e.target.value)} className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none appearance-none cursor-pointer">
                        <option value="en">English</option><option value="zh">中文</option><option value="ko">한국어</option><option value="ja">日本語</option><option value="es">Español</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="settings-subtitle-lang" className="block text-sm text-gray-400 mb-1.5">Subtitle Language</label>
                      <select id="settings-subtitle-lang" value={subtitleLang} onChange={e => setSubtitleLang(e.target.value)} className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none appearance-none cursor-pointer">
                        <option value="en">English</option><option value="zh">中文</option><option value="ko">한국어</option><option value="ja">日本語</option><option value="es">Español</option><option value="off">Off</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Data & Storage */}
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-5">Data & Storage</h2>
                  <div className="flex items-center justify-between mb-4">
                    <div><p className="text-sm font-medium">Data Saver</p><p className="text-xs text-gray-400">Reduce data usage when streaming on mobile networks</p></div>
                    <Toggle checked={dataSaver} onChange={setDataSaver} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                    <div><p className="text-sm font-medium">Cache</p><p className="text-xs text-gray-400">156 MB used</p></div>
                    <button onClick={() => toast("Cache cleared", "success")} className="text-sm text-red-400 hover:text-red-300 transition">Clear Cache</button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => toast("Preferences saved", "success")} className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition">Save Preferences</button>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-400 text-center mb-6">This action is permanent and cannot be undone. All your data, watch history, and purchases will be lost.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition">Cancel</button>
              <button onClick={async () => { try { await profileApi.deleteAccount(token!); logout(); router.push("/"); } catch {} }} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}