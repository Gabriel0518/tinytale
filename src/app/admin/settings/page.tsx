"use client";

import { useState } from "react";
import AdminLayout from "../layout";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "TinyTale",
    defaultCoinPrice: 100,
    freeEpisodesCount: 3,
    enableRegistration: true,
    enableComments: true,
    maintenanceMode: false,
    stripeEnabled: true,
    paypalEnabled: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save settings to API
      await new Promise((r) => setTimeout(r, 500));
      alert("Settings saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">System Settings</h1>

        <div className="space-y-6">
          {/* General */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">General</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Site Name</label>
                <input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Default Unlock Price (coins)</label>
                <input type="number" value={settings.defaultCoinPrice} onChange={(e) => setSettings({ ...settings, defaultCoinPrice: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Free Episodes per Drama</label>
                <input type="number" value={settings.freeEpisodesCount} onChange={(e) => setSettings({ ...settings, freeEpisodesCount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Features</h2>
            <div className="space-y-4">
              {[
                { key: "enableRegistration", label: "User Registration", desc: "Allow new users to register" },
                { key: "enableComments", label: "Comments", desc: "Allow users to post comments" },
                { key: "maintenanceMode", label: "Maintenance Mode", desc: "Show maintenance page to users" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [item.key]: !(settings as any)[item.key] })}
                    className={`relative h-6 w-11 rounded-full transition ${
                      (settings as any)[item.key] ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      (settings as any)[item.key] ? "left-[22px]" : "left-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Methods</h2>
            <div className="space-y-4">
              {[
                { key: "stripeEnabled", label: "Stripe", desc: "Credit/debit card payments" },
                { key: "paypalEnabled", label: "PayPal", desc: "PayPal payments" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [item.key]: !(settings as any)[item.key] })}
                    className={`relative h-6 w-11 rounded-full transition ${
                      (settings as any)[item.key] ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      (settings as any)[item.key] ? "left-[22px]" : "left-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
