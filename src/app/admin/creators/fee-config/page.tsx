"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, DollarSign, Globe, Calculator } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { AirwallexFeeConfigItem } from "@/types/creator";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

type FormData = {
  type: "payment_channel" | "airwallex_transfer";
  provider: string;
  countryCode: string;
  currency: string;
  transferMethod: "LOCAL" | "SWIFT";
  feeRate: string;
  fixedFee: string;
  minFee: string;
  maxFee: string;
  isActive: boolean;
  note: string;
};

const emptyForm: FormData = {
  type: "airwallex_transfer",
  provider: "airwallex",
  countryCode: "",
  currency: "*",
  transferMethod: "LOCAL",
  feeRate: "0",
  fixedFee: "0",
  minFee: "0",
  maxFee: "0",
  isActive: true,
  note: "",
};

function feePreview(amount: number, config: FormData): { fee: number; net: number } {
  const rate = parseFloat(config.feeRate) || 0;
  const fixed = parseFloat(config.fixedFee) || 0;
  const min = parseFloat(config.minFee) || 0;
  const max = parseFloat(config.maxFee) || 0;
  let fee = amount * rate + fixed;
  if (min > 0 && fee < min) fee = min;
  if (max > 0 && fee > max) fee = max;
  return { fee: Math.round(fee * 100) / 100, net: Math.round((amount - fee) * 100) / 100 };
}

export default function AirwallexFeeConfigPage() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<AirwallexFeeConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [previewAmount, setPreviewAmount] = useState("100");

  const fetchConfigs = useCallback(async () => {
    try {
      const res: any = await adminApi.getAirwallexFeeConfigs();
      if (res?.success) setConfigs(res.data || []);
    } catch {
      toast("Failed to load fee configs", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchConfigs(); }, [fetchConfigs]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item: AirwallexFeeConfigItem) => {
    setEditingId(item._id);
    setForm({
      type: item.type || "airwallex_transfer",
      provider: item.provider || "airwallex",
      countryCode: item.countryCode,
      currency: item.currency,
      transferMethod: item.transferMethod,
      feeRate: String(item.feeRate),
      fixedFee: String(item.fixedFee),
      minFee: String(item.minFee),
      maxFee: String(item.maxFee),
      isActive: item.isActive,
      note: item.note,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.countryCode.trim()) {
      toast("Country code is required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        provider: form.provider.toLowerCase().trim() || "airwallex",
        countryCode: form.countryCode.toUpperCase().trim(),
        currency: form.currency.toUpperCase().trim() || "*",
        transferMethod: form.transferMethod,
        feeRate: parseFloat(form.feeRate) || 0,
        fixedFee: parseFloat(form.fixedFee) || 0,
        minFee: parseFloat(form.minFee) || 0,
        maxFee: parseFloat(form.maxFee) || 0,
        isActive: form.isActive,
        note: form.note,
      };

      if (editingId) {
        await adminApi.updateAirwallexFeeConfig(editingId, payload);
        toast("Fee config updated", "info");
      } else {
        await adminApi.createAirwallexFeeConfig(payload);
        toast("Fee config created", "info");
      }
      setShowModal(false);
      void fetchConfigs();
    } catch (err: any) {
      toast(err?.message || "Failed to save", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this fee config?")) return;
    try {
      await adminApi.deleteAirwallexFeeConfig(id);
      toast("Fee config deleted", "info");
      fetchConfigs();
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const preview = feePreview(parseFloat(previewAmount) || 100, form);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Fee Configuration</h1>
          <p className="mt-1 text-sm text-gray-400">
            Configure payment channel fees and transfer fees by provider, country, and method.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Fee Rule
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2"><Globe className="h-5 w-5 text-indigo-400" /></div>
            <div>
              <p className="text-sm text-gray-400">Active Rules</p>
              <p className="text-xl font-bold text-gray-100">{configs.filter((c) => c.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><DollarSign className="h-5 w-5 text-green-400" /></div>
            <div>
              <p className="text-sm text-gray-400">Countries Covered</p>
              <p className="text-xl font-bold text-gray-100">
                {new Set(configs.filter((c) => c.isActive && c.countryCode !== "DEFAULT").map((c) => c.countryCode)).size}
              </p>
            </div>
          </div>
        </div>
        <div className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2"><Calculator className="h-5 w-5 text-amber-400" /></div>
            <div>
              <p className="text-sm text-gray-400">Has Default Rule</p>
              <p className="text-xl font-bold text-gray-100">
                {configs.some((c) => c.countryCode === "DEFAULT" && c.isActive) ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={panelClassName}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : configs.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            No fee configs yet. Add a DEFAULT rule to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 text-left text-xs uppercase text-gray-500">
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Provider</th>
                  <th className="px-3 py-3">Country</th>
                  <th className="px-3 py-3">Currency</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3">Fee Rate</th>
                  <th className="px-3 py-3">Fixed Fee</th>
                  <th className="px-3 py-3">Min / Max</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Note</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((item) => (
                  <tr key={item._id} className="border-b border-gray-800/50 hover:bg-[#1a1a2e]/50">
                    <td className="px-3 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        item.type === 'payment_channel'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {item.type === 'payment_channel' ? 'Payment' : 'Transfer'}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-200">
                      {item.provider || 'airwallex'}
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-200">
                      {item.countryCode === "DEFAULT" ? (
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">DEFAULT</span>
                      ) : (
                        item.countryCode
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-300">{item.currency}</td>
                    <td className="px-3 py-3 text-gray-300">{item.transferMethod}</td>
                    <td className="px-3 py-3 text-gray-300">{(item.feeRate * 100).toFixed(2)}%</td>
                    <td className="px-3 py-3 text-gray-300">${item.fixedFee.toFixed(2)}</td>
                    <td className="px-3 py-3 text-gray-400">
                      ${item.minFee.toFixed(2)} / {item.maxFee > 0 ? `$${item.maxFee.toFixed(2)}` : "∞"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.isActive
                            ? "bg-green-500/20 text-green-300"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {item.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-3 text-gray-500" title={item.note}>
                      {item.note || "-"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded p-1 text-gray-400 hover:bg-[#1a1a2e] hover:text-indigo-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="rounded p-1 text-gray-400 hover:bg-[#1a1a2e] hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-100">
              {editingId ? "Edit Fee Rule" : "New Fee Rule"}
            </h2>

            <div className="space-y-4">
              {/* Type and Provider */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Fee Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "payment_channel" | "airwallex_transfer" })}
                    disabled={!!editingId}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="payment_channel">Payment Channel (收款费用)</option>
                    <option value="airwallex_transfer">Airwallex Transfer (转账费用)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Provider</label>
                  <input
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    placeholder="airwallex, stripe, paypal..."
                    disabled={!!editingId}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Country Code</label>
                  <input
                    value={form.countryCode}
                    onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                    placeholder="US, GB, DEFAULT..."
                    disabled={!!editingId}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Currency</label>
                  <input
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    placeholder="* for all, USD, EUR..."
                    disabled={!!editingId}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Transfer Method</label>
                  <select
                    value={form.transferMethod}
                    onChange={(e) => setForm({ ...form, transferMethod: e.target.value as "LOCAL" | "SWIFT" })}
                    disabled={!!editingId}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="LOCAL">LOCAL</option>
                    <option value="SWIFT">SWIFT</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Fee Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(parseFloat(form.feeRate) * 100).toFixed(2)}
                    onChange={(e) => setForm({ ...form, feeRate: String((parseFloat(e.target.value) || 0) / 100) })}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Fixed Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.fixedFee}
                    onChange={(e) => setForm({ ...form, fixedFee: e.target.value })}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Min Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.minFee}
                    onChange={(e) => setForm({ ...form, minFee: e.target.value })}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Max Fee ($, 0=no limit)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.maxFee}
                    onChange={(e) => setForm({ ...form, maxFee: e.target.value })}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-gray-400 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
                </label>
                <span className="text-sm text-gray-300">Active</span>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Note</label>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Optional admin note..."
                  className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Fee Preview */}
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="mb-2 text-xs font-medium text-gray-400">Fee Preview</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Amount $</span>
                  <input
                    type="number"
                    value={previewAmount}
                    onChange={(e) => setPreviewAmount(e.target.value)}
                    className="w-24 rounded border border-gray-700/50 bg-[#1a1a2e] px-2 py-1 text-sm text-gray-200"
                  />
                  <span className="text-sm text-gray-400">→</span>
                  <span className="text-sm text-red-400">Fee: ${preview.fee.toFixed(2)}</span>
                  <span className="text-sm text-green-400">Net: ${preview.net.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-700/50 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a2e]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
