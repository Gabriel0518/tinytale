"use client";

import { useState } from "react";
import AdminLayout from "../layout";

const roles = [
  { name: "Super Admin", count: 1 },
  { name: "Finance Manager", count: 3 },
  { name: "Content Operator", count: 5 },
  { name: "Support Agent", count: 4 },
];

const permissionModules = [
  { module: "Content Management", subs: ["Dramas", "Categories", "Comments"] },
  { module: "User Management", subs: ["Users", "Promoters"] },
  { module: "Finance", subs: ["Orders", "Subscriptions", "Withdrawals"] },
  { module: "Marketing", subs: ["Check-in", "Tasks", "Campaigns"] },
  { module: "System", subs: ["Admins", "Roles", "Settings", "Logs"] },
];

const actions = ["View", "Create", "Edit", "Delete"] as const;

type Perms = Record<string, Record<string, Record<string, boolean>>>;

function buildDefaultPerms(): Perms {
  const p: Perms = {};
  for (const r of roles) {
    p[r.name] = {};
    for (const m of permissionModules) {
      p[r.name][m.module] = {};
      for (const s of m.subs) {
        for (const a of actions) {
          p[r.name][m.module][`${s}:${a}`] = r.name === "Super Admin";
        }
      }
    }
  }
  return p;
}

export default function RolesPage() {
  const [selected, setSelected] = useState(roles[0].name);
  const [perms, setPerms] = useState<Perms>(buildDefaultPerms);

  const toggle = (mod: string, key: string) => {
    setPerms((prev) => ({
      ...prev,
      [selected]: {
        ...prev[selected],
        [mod]: { ...prev[selected][mod], [key]: !prev[selected][mod][key] },
      },
    }));
  };

  const toggleModule = (mod: string, subs: string[]) => {
    const allKeys = subs.flatMap((s) => actions.map((a) => `${s}:${a}`));
    const allOn = allKeys.every((k) => perms[selected][mod][k]);
    setPerms((prev) => ({
      ...prev,
      [selected]: {
        ...prev[selected],
        [mod]: Object.fromEntries(allKeys.map((k) => [k, !allOn])),
      },
    }));
  };

  const isModuleOn = (mod: string, subs: string[]) =>
    subs.flatMap((s) => actions.map((a) => `${s}:${a}`)).every((k) => perms[selected][mod][k]);

  const isModulePartial = (mod: string, subs: string[]) => {
    const keys = subs.flatMap((s) => actions.map((a) => `${s}:${a}`));
    const on = keys.filter((k) => perms[selected][mod][k]).length;
    return on > 0 && on < keys.length;
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar - Role list */}
        <div className="w-64 shrink-0">
          <div className="rounded-lg bg-white shadow">
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-sm font-semibold text-gray-700">Roles</span>
              <button className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700">
                Add Role
              </button>
            </div>
            <ul>
              {roles.map((r) => (
                <li
                  key={r.name}
                  onClick={() => setSelected(r.name)}
                  className={`cursor-pointer border-b px-4 py-3 text-sm last:border-0 ${
                    selected === r.name
                      ? "bg-red-50 font-medium text-red-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{r.name}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {r.count}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right panel - Permission tree */}
        <div className="flex-1 rounded-lg bg-white shadow">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Permissions for <span className="text-red-600">{selected}</span>
            </h2>
          </div>

          <div className="divide-y">
            {permissionModules.map((m) => (
              <div key={m.module} className="p-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={isModuleOn(m.module, m.subs)}
                    ref={(el) => {
                      if (el) el.indeterminate = isModulePartial(m.module, m.subs);
                    }}
                    onChange={() => toggleModule(m.module, m.subs)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  {m.module}
                </label>

                <div className="ml-6 mt-3 space-y-2">
                  {m.subs.map((sub) => (
                    <div key={sub} className="flex items-center gap-6">
                      <span className="w-28 text-sm text-gray-600">{sub}</span>
                      {actions.map((a) => (
                        <label key={a} className="flex items-center gap-1 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            checked={!!perms[selected]?.[m.module]?.[`${sub}:${a}`]}
                            onChange={() => toggle(m.module, `${sub}:${a}`)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          {a}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t p-4">
            <button className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
