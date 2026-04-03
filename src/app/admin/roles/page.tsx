"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import { Search, Plus, Shield, ChevronRight } from "lucide-react";

// --- Types ---
interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  adminCount?: number;
}

interface PermissionDef {
  key: string;
  label: string;
  desc?: string;
}

interface PermissionSection {
  name: string;
  permissions: PermissionDef[];
}

interface PermissionModule {
  key: string;
  name: string;
  permissions?: PermissionDef[];
  sections?: PermissionSection[];
}

// --- Permission modules ---
const permissionModules: PermissionModule[] = [
  {
    key: "dashboard",
    name: "Dashboard & Analytics",
    permissions: [
      { key: "dashboard:view", label: "View Dashboard", desc: "Can access the main overview page." },
      { key: "dashboard:export", label: "Export Reports", desc: "Can download PDF/CSV reports." },
      { key: "dashboard:configure", label: "Configure Widgets", desc: "Can customize dashboard layout." },
    ],
  },
  {
    key: "content",
    name: "Content Management",
    sections: [
      {
        name: "ARTICLES & POSTS",
        permissions: [
          { key: "content:create", label: "Create New" },
          { key: "content:edit_own", label: "Edit Own" },
          { key: "content:edit_others", label: "Edit Others" },
          { key: "content:delete", label: "Delete" },
          { key: "content:publish", label: "Publish" },
        ],
      },
      {
        name: "MEDIA LIBRARY",
        permissions: [
          { key: "media:upload", label: "Upload Files" },
          { key: "media:delete", label: "Delete Files" },
        ],
      },
    ],
  },
  {
    key: "users",
    name: "User Management",
    permissions: [
      { key: "users:view", label: "View Users" },
      { key: "users:ban", label: "Ban Users" },
      { key: "users:edit_roles", label: "Edit Roles" },
    ],
  },
];

function getAllPermissionKeys(mod: PermissionModule): string[] {
  if (mod.permissions) return mod.permissions.map((p) => p.key);
  if (mod.sections) return mod.sections.flatMap((s) => s.permissions.map((p) => p.key));
  return [];
}

// --- Fallback roles for when API is unavailable ---
const fallbackRoles: Role[] = [
  { _id: "1", name: "Content Manager", description: "Manages all content and media", permissions: ["content:create", "content:edit_own", "content:publish", "media:upload"], adminCount: 4 },
  { _id: "2", name: "Super Admin", description: "Full system access", permissions: permissionModules.flatMap(getAllPermissionKeys), adminCount: 1 },
  { _id: "3", name: "Finance", description: "Financial reports and billing", permissions: ["dashboard:view", "dashboard:export"], adminCount: 2 },
  { _id: "4", name: "Customer Service", description: "User support and moderation", permissions: ["users:view", "users:ban"], adminCount: 3 },
];

// --- Toggle Switch Component ---
function ToggleSwitch({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? "bg-indigo-600" : "bg-gray-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// --- Main Page Component ---
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [lastSave, setLastSave] = useState<string>("2 mins ago");

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const res: any = await adminApi.getRoles();
      const data = res.data || res.roles || res;
      if (Array.isArray(data) && data.length > 0) {
        setRoles(data);
        setSelectedId(data[0]._id);
        setPermissions(data[0].permissions || []);
        initModuleAccess(data[0].permissions || []);
      } else {
        setRoles(fallbackRoles);
        setSelectedId(fallbackRoles[0]._id);
        setPermissions(fallbackRoles[0].permissions);
        initModuleAccess(fallbackRoles[0].permissions);
      }
    } catch {
      setRoles(fallbackRoles);
      setSelectedId(fallbackRoles[0]._id);
      setPermissions(fallbackRoles[0].permissions);
      initModuleAccess(fallbackRoles[0].permissions);
    } finally {
      setLoading(false);
    }
  }, []);

  function initModuleAccess(perms: string[]) {
    const access: Record<string, boolean> = {};
    permissionModules.forEach((mod) => {
      const keys = getAllPermissionKeys(mod);
      access[mod.key] = keys.some((k) => perms.includes(k));
    });
    setModuleAccess(access);
  }

  useEffect(() => { void fetchRoles(); }, [fetchRoles]);

  // Select a role
  function selectRole(role: Role) {
    setSelectedId(role._id);
    setPermissions(role.permissions || []);
    initModuleAccess(role.permissions || []);
  }

  // Toggle single permission
  function togglePermission(key: string) {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  // Toggle module access
  function toggleModuleAccess(mod: PermissionModule) {
    const keys = getAllPermissionKeys(mod);
    const isOn = moduleAccess[mod.key];
    setModuleAccess((prev) => ({ ...prev, [mod.key]: !isOn }));
    if (isOn) {
      setPermissions((prev) => prev.filter((k) => !keys.includes(k)));
    }
  }

  // Select all permissions
  function toggleSelectAll() {
    const allKeys = permissionModules.flatMap(getAllPermissionKeys);
    const allSelected = allKeys.every((k) => permissions.includes(k));
    if (allSelected) {
      setPermissions([]);
      setModuleAccess(Object.fromEntries(permissionModules.map((m) => [m.key, false])));
    } else {
      setPermissions(allKeys);
      setModuleAccess(Object.fromEntries(permissionModules.map((m) => [m.key, true])));
    }
  }

  // Save permissions
  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.updateRole(selectedId, { permissions });
      setRoles((prev) =>
        prev.map((r) => (r._id === selectedId ? { ...r, permissions } : r))
      );
      setLastSave("just now");
    } catch {
      // silent fail for demo
    } finally {
      setSaving(false);
    }
  }

  // Add new role
  async function handleAddRole() {
    if (!newRoleName.trim()) return;
    try {
      const res: any = await adminApi.createRole({
        name: newRoleName.trim(),
        description: newRoleDesc.trim(),
        permissions: [],
      });
      const newRole = res.data || res.role || res;
      setRoles((prev) => [...prev, newRole]);
      setAddingRole(false);
      setNewRoleName("");
      setNewRoleDesc("");
      selectRole(newRole);
    } catch {
      // Fallback: add locally
      const localRole: Role = {
        _id: Date.now().toString(),
        name: newRoleName.trim(),
        description: newRoleDesc.trim(),
        permissions: [],
        adminCount: 0,
      };
      setRoles((prev) => [...prev, localRole]);
      setAddingRole(false);
      setNewRoleName("");
      setNewRoleDesc("");
      selectRole(localRole);
    }
  }

  const selectedRole = roles.find((r) => r._id === selectedId);
  const allKeys = permissionModules.flatMap(getAllPermissionKeys);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => permissions.includes(k));

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f17] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Role & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">System Settings / Access Control</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search settings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-gray-700/50 bg-[#1a1a2e] py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar - Roles */}
        <div className="w-64 shrink-0">
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d]">
            <div className="flex items-center justify-between border-b border-gray-700/50 p-4">
              <span className="text-sm font-semibold text-gray-300">Roles</span>
              <button
                onClick={() => setAddingRole(true)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Role
              </button>
            </div>

            {/* Add role inline form */}
            {addingRole && (
              <div className="border-b border-gray-700/50 p-3 space-y-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Role name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-600"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-600"
                  onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRole}
                    className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setAddingRole(false); setNewRoleName(""); setNewRoleDesc(""); }}
                    className="flex-1 rounded-lg border border-gray-700/50 py-1.5 text-xs text-gray-400 hover:bg-[#1a1a2e]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Role list */}
            <div className="divide-y divide-gray-700/50">
              {filteredRoles.map((role) => (
                <button
                  key={role._id}
                  onClick={() => selectRole(role)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    selectedId === role._id
                      ? "bg-indigo-600/20 border-l-2 border-l-indigo-500"
                      : "hover:bg-[#1a1a2e] border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${selectedId === role._id ? "text-indigo-400" : "text-gray-300"}`}>
                      {role.name}
                    </span>
                    <ChevronRight className={`h-4 w-4 ${selectedId === role._id ? "text-indigo-400" : "text-gray-600"}`} />
                  </div>
                  {role.description && (
                    <p className="mt-0.5 text-xs text-gray-500 truncate">{role.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {/* User avatars */}
                    <div className="flex -space-x-1.5">
                      {Array.from({ length: Math.min(role.adminCount || 0, 3) }).map((_, i) => (
                        <div
                          key={i}
                          className="h-5 w-5 rounded-full border border-[#13131d] bg-gradient-to-br from-indigo-400 to-purple-500"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {role.adminCount || 0} user{(role.adminCount || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Permissions */}
        <div className="flex-1">
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d]">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-gray-700/50 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold text-gray-100">{selectedRole?.name || "Select a Role"}</h2>
                </div>
                <p className="mt-1 text-sm text-gray-500">Permissions — Granular access control for this role</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-600 bg-[#1a1a2e] text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-400">Select All Permissions</span>
              </label>
            </div>

            {/* Permission modules */}
            <div className="divide-y divide-gray-700/50">
              {permissionModules.map((mod) => {
                const isModOn = moduleAccess[mod.key] ?? false;
                return (
                  <div key={mod.key} className="p-5">
                    {/* Module header with toggle */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-200">{mod.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Module Access</span>
                        <ToggleSwitch enabled={isModOn} onChange={() => toggleModuleAccess(mod)} />
                      </div>
                    </div>

                    {/* Permissions list */}
                    <div className={`space-y-3 ${!isModOn ? "opacity-40 pointer-events-none" : ""}`}>
                      {mod.permissions && mod.permissions.map((perm) => (
                        <label key={perm.key} className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={permissions.includes(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                            disabled={!isModOn}
                            className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-[#1a1a2e] text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0"
                          />
                          <div>
                            <span className="text-sm text-gray-300 group-hover:text-gray-100">{perm.label}</span>
                            {perm.desc && <p className="text-xs text-gray-500">{perm.desc}</p>}
                          </div>
                        </label>
                      ))}

                      {mod.sections && mod.sections.map((section) => (
                        <div key={section.name} className="mt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{section.name}</p>
                          <div className="space-y-2 ml-1">
                            {section.permissions.map((perm) => (
                              <label key={perm.key} className="flex items-start gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={permissions.includes(perm.key)}
                                  onChange={() => togglePermission(perm.key)}
                                  disabled={!isModOn}
                                  className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-[#1a1a2e] text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0"
                                />
                                <span className="text-sm text-gray-300 group-hover:text-gray-100">{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-700/50 px-5 py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (selectedRole) {
                      setPermissions(selectedRole.permissions || []);
                      initModuleAccess(selectedRole.permissions || []);
                    }
                  }}
                  className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Discard Changes
                </button>
                <span className="text-xs text-gray-600">Last autosave: {lastSave}</span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
