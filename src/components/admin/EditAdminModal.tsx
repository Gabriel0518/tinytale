"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/adminApi";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  admin: { _id: string; username: string; fullName: string; email: string; roleId: string; status: string } | null;
  roles: Array<{ _id: string; name: string }>;
}

export default function EditAdminModal({ open, onClose, onConfirm, admin, roles }: Props) {
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && admin) {
      setFullName(admin.fullName || "");
      setRoleId(admin.roleId || "");
      setStatus(admin.status || "active");
      setSubmitting(false);
    }
  }, [open, admin]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, handleEscape]);

  const handleSubmit = async () => {
    if (!admin || !fullName || !roleId) return;
    setSubmitting(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token") || "demo-token"
          : "demo-token";
      await api.put(
        `/api/admin/settings/admins/${admin._id}`,
        { fullName, roleId, status },
        { token }
      );
    } catch (error) {
      console.error("Failed to update admin:", error);
    } finally {
      setSubmitting(false);
      onConfirm();
    }
  };

  if (!open || !admin) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-gray-700/50 bg-[#1a1a2e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-700/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Edit Administrator</h2>
              <p className="text-sm text-gray-400">Update staff account details and permissions.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-700/50 hover:text-gray-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5 p-6">
          {/* Username (readonly) */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Username</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="text"
                value={admin.username}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-gray-700/50 bg-[#13131d] py-2.5 pl-9 pr-3 text-sm text-gray-500 outline-none opacity-60"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Username cannot be changed once created.</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Full Name</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border border-gray-700/50 bg-[#13131d] py-2.5 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Role Permission */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Role Permission</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-700/50 bg-[#13131d] py-2.5 pl-9 pr-8 text-sm text-gray-200 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select a role</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <p className="mt-1 text-xs text-gray-500">Grants access to content management and user operations.</p>
          </div>

          {/* Password Management Info */}
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-indigo-300">Password Management</p>
                <p className="mt-1 text-xs text-indigo-300/70">
                  To change this user&apos;s password, please use the &quot;Reset Password&quot; function from the main list.
                </p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Account Status</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStatus(status === "active" ? "inactive" : "active")}
                className={`relative h-6 w-11 rounded-full transition-colors ${status === "active" ? "bg-indigo-600" : "bg-gray-600"}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${status === "active" ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
              <span className="text-sm text-gray-200">{status === "active" ? "Active" : "Inactive"}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">Disable to temporarily block access.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-700/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700/50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!fullName || !roleId || submitting}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
