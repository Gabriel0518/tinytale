"use client";

import { useState, useMemo } from "react";
import AdminLayout from "../layout";

type ActionType = "Create" | "Edit" | "Delete" | "Login";
type Module = "Content" | "Users" | "Finance" | "Marketing" | "System";

interface LogEntry {
  id: string;
  timestamp: string;
  operator: string;
  action: ActionType;
  module: Module;
  target: string;
  ip: string;
  details: string;
}

const mockLogs: LogEntry[] = [
  { id: "LOG-20260201-001", timestamp: "2026-02-01 09:12:34", operator: "Alice Wang", action: "Create", module: "Content", target: "Drama #1042", ip: "192.168.1.10", details: "Created new drama 'Midnight Heir'" },
  { id: "LOG-20260201-002", timestamp: "2026-02-01 10:05:11", operator: "Bob Chen", action: "Edit", module: "Users", target: "User #8821", ip: "10.0.0.55", details: "Updated user role to VIP" },
  { id: "LOG-20260201-003", timestamp: "2026-02-01 11:30:00", operator: "Carol Li", action: "Delete", module: "Content", target: "Episode #3391", ip: "172.16.0.8", details: "Removed duplicate episode" },
  { id: "LOG-20260201-004", timestamp: "2026-02-01 12:00:45", operator: "David Zhao", action: "Login", module: "System", target: "Admin Panel", ip: "203.0.113.42", details: "Admin login from new device" },
  { id: "LOG-20260202-005", timestamp: "2026-02-02 08:22:10", operator: "Alice Wang", action: "Edit", module: "Finance", target: "Order #7710", ip: "192.168.1.10", details: "Refunded 500 coins to user" },
  { id: "LOG-20260202-006", timestamp: "2026-02-02 09:45:33", operator: "Bob Chen", action: "Create", module: "Marketing", target: "Campaign #55", ip: "10.0.0.55", details: "Launched Valentine promo campaign" },
  { id: "LOG-20260202-007", timestamp: "2026-02-02 14:18:27", operator: "Carol Li", action: "Delete", module: "Users", target: "User #9102", ip: "172.16.0.8", details: "Banned spam account" },
  { id: "LOG-20260203-008", timestamp: "2026-02-03 07:55:02", operator: "David Zhao", action: "Login", module: "System", target: "Admin Panel", ip: "203.0.113.42", details: "Routine morning login" },
];

const operators = ["Alice Wang", "Bob Chen", "Carol Li", "David Zhao"];
const modules: Module[] = ["Content", "Users", "Finance", "Marketing", "System"];
const actionTypes: ActionType[] = ["Create", "Edit", "Delete", "Login"];

const actionColors: Record<ActionType, string> = {
  Create: "bg-green-100 text-green-700",
  Edit: "bg-amber-100 text-amber-700",
  Delete: "bg-red-100 text-red-700",
  Login: "bg-purple-100 text-purple-700",
};

const PAGE_SIZE = 5;

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

export default function AuditLogsPage() {
  const [keyword, setKeyword] = useState("");
  const [operator, setOperator] = useState("All");
  const [module, setModule] = useState("All");
  const [checkedActions, setCheckedActions] = useState<Set<ActionType>>(new Set(actionTypes));
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const toggleAction = (a: ActionType) => {
    setCheckedActions((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a); else next.add(a);
      return next;
    });
    setPage(1);
  };

  const resetFilters = () => {
    setKeyword("");
    setOperator("All");
    setModule("All");
    setCheckedActions(new Set(actionTypes));
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const filtered = useMemo(() => {
    return mockLogs.filter((log) => {
      if (keyword && !Object.values(log).some((v) => String(v).toLowerCase().includes(keyword.toLowerCase()))) return false;
      if (operator !== "All" && log.operator !== operator) return false;
      if (module !== "All" && log.module !== module) return false;
      if (!checkedActions.has(log.action)) return false;
      if (dateFrom && log.timestamp < dateFrom) return false;
      if (dateTo && log.timestamp > dateTo + " 23:59:59") return false;
      return true;
    });
  }, [keyword, operator, module, checkedActions, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const header = "Log ID,Timestamp,Operator,Action,Module,Target,IP Address,Details";
    const rows = filtered.map((l) => `${l.id},${l.timestamp},${l.operator},${l.action},${l.module},${l.target},${l.ip},"${l.details}"`);
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
          <button onClick={exportCSV} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Keyword</label>
              <input value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} placeholder="Search logs..." className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Operator</label>
              <select value={operator} onChange={(e) => { setOperator(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                <option>All</option>
                {operators.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Module</label>
              <select value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                <option>All</option>
                {modules.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Actions</label>
              <div className="flex gap-3">
                {actionTypes.map((a) => (
                  <label key={a} className="flex items-center gap-1 text-sm text-gray-700">
                    <input type="checkbox" checked={checkedActions.has(a)} onChange={() => toggleAction(a)} className="rounded" />
                    {a}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <button onClick={resetFilters} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Log ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No logs match the current filters</td></tr>
              ) : (
                paginated.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">{log.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{log.timestamp}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{getInitials(log.operator)}</span>
                        <span className="text-gray-700">{log.operator}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${actionColors[log.action]}`}>{log.action}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{log.target}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">{log.ip}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-500">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} logs</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`rounded-lg px-3 py-1.5 ${page === i + 1 ? "bg-indigo-600 text-white" : "border hover:bg-gray-50"}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
