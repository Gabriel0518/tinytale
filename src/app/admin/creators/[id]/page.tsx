"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShieldAlert, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import {
  formatAdminDate,
  formatUsd,
  getCreatorBankStatusMeta,
  getCreatorLifecycleMeta,
  getMockCreator,
} from "../_lib/mockData";
import type { CreatorAdminCreatorDetail } from "@/types/creator";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

function resolveActivePayoutProvider(bankAccount: CreatorAdminCreatorDetail["bankAccount"]) {
  if (bankAccount.provider) return bankAccount.provider;
  if (bankAccount.bankProvider) return bankAccount.bankProvider;
  if (bankAccount.airwallexBeneficiaryId) return "airwallex";
  if (bankAccount.stripeAccountId || bankAccount.stripeEmail) return "stripe";
  return "airwallex";
}

function getActivePayoutIdentifier(bankAccount: CreatorAdminCreatorDetail["bankAccount"], provider: string) {
  if (provider === "airwallex") {
    return bankAccount.airwallexBeneficiaryId || "Not available";
  }
  if (provider === "stripe") {
    return bankAccount.stripeAccountId || "Not available";
  }
  return bankAccount.maskedAccountNumber || "No external bank account attached";
}

export default function CreatorDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const id = String(params?.id || "");
  const [data, setData] = useState<CreatorAdminCreatorDetail | null>(getMockCreator(id));
  const [loading, setLoading] = useState(true);
  const [nextStatus, setNextStatus] = useState("active");
  const [nextLevel, setNextLevel] = useState("Rising");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingBank, setDeletingBank] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreator(id);
        const next = response?.data?.creator || response?.data || response;
        if (!cancelled && next?.id) {
          setData(next);
          setNextStatus(next.status);
          setNextLevel(next.level);
        }
      } catch {
        const fallback = getMockCreator(id);
        if (!cancelled) {
          setData(fallback);
          setNextStatus(fallback?.status || "active");
          setNextLevel(fallback?.level || "Rising");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const statusMeta = useMemo(() => getCreatorLifecycleMeta((data?.status || "active") as any), [data?.status]);
  const bankMeta = useMemo(() => getCreatorBankStatusMeta((data?.bankStatus || "missing") as any), [data?.bankStatus]);
  const activePayoutProvider = useMemo(
    () => (data ? resolveActivePayoutProvider(data.bankAccount) : "airwallex"),
    [data],
  );
  const hasLegacyStripeRecord = useMemo(
    () => Boolean(
      data?.bankAccount.stripeAccountId
      && activePayoutProvider !== "stripe",
    ),
    [activePayoutProvider, data],
  );
  const hasLegacyAirwallexRecord = useMemo(
    () => Boolean(
      data?.bankAccount.airwallexBeneficiaryId
      && activePayoutProvider !== "airwallex",
    ),
    [activePayoutProvider, data],
  );

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    try {
      await adminApi.updateCreator(data.id, {
        status: nextStatus,
        level: nextLevel,
        note,
      });
    } catch {
      // Keep the local experience functional until the admin backend is available.
    } finally {
      setSaving(false);
    }

    setData((current) => current ? {
      ...current,
      status: nextStatus as any,
      level: nextLevel,
      auditTrail: [
        {
          id: `local-${Date.now()}`,
          at: new Date().toISOString(),
          actor: "Current Admin",
          action: "Creator account updated",
          summary: note.trim() || `Status changed to ${nextStatus}, level changed to ${nextLevel}.`,
        },
        ...current.auditTrail,
      ],
    } : current);

    toast("Creator profile updated.", "success");
    setNote("");
  }

  async function handleDeleteBankAccount() {
    if (!data) return;

    const hasBankRecord = Boolean(
      data.bankAccount.bankName
      || data.bankAccount.maskedAccountNumber
      || data.bankAccount.airwallexBeneficiaryId
      || data.bankAccount.stripeAccountId
    );

    if (!hasBankRecord) {
      toast("No payout account is attached to this creator.", "info");
      return;
    }

    const confirmed = window.confirm(
      "Delete this creator payout account record? This will clear Stripe/Airwallex bank data for both admin and creator views.",
    );
    if (!confirmed) return;

    setDeletingBank(true);
    try {
      const response: any = await adminApi.deleteCreatorBankAccount(data.id);
      const nextBank = response?.data?.bankAccount;
      setData((current) => current ? {
        ...current,
        bankStatus: response?.data?.bankStatus || "missing",
        bankAccount: nextBank ? {
          ...current.bankAccount,
          ...nextBank,
        } : {
          status: "missing",
          accountHolderName: "",
          bankName: "",
          maskedAccountNumber: "",
          country: "",
          updatedAt: response?.data?.updatedAt || new Date().toISOString(),
          provider: "airwallex",
          providerLabel: "Airwallex Beneficiary",
          verificationLabel: "Missing",
          stripeAccountId: "",
          stripeEmail: "",
          stripeRequirementsCurrentlyDue: [],
          stripeRequirementsPendingVerification: [],
          stripeRequirementsEventuallyDue: [],
          stripeDisabledReason: "",
          adminOverrideStatus: null,
          airwallexBeneficiaryId: "",
          airwallexEntityType: "",
          airwallexTransferMethods: [],
          airwallexVerificationCode: "",
          airwallexVerificationAccountNameMatchResult: "",
          airwallexVerificationResolvedAccountName: "",
          airwallexVerificationResolvedBankName: "",
          airwallexVerificationCheckedAt: null,
        },
        auditTrail: [
          {
            id: `bank-delete-${Date.now()}`,
            at: response?.data?.updatedAt || new Date().toISOString(),
            actor: "Current Admin",
            action: "Creator bank account deleted",
            summary: "Cleared payout bank account data so the creator can resubmit fresh payout details.",
          },
          ...current.auditTrail,
        ],
      } : current);
      toast("Creator payout account deleted.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to delete payout account.", "error");
    } finally {
      setDeletingBank(false);
    }
  }

  if (loading && !data) {
    return <div className="py-16 text-center text-sm text-gray-500">Loading creator detail...</div>;
  }

  if (!data) {
    return (
      <div className="space-y-4 text-gray-200">
        <Link href="/admin/creators/list" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200">
          <ArrowLeft className="h-4 w-4" />
          Back to creator list
        </Link>
        <div className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-8 text-center text-sm text-gray-400">Creator not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-200">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/creators/list" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" />
            Back to creator list
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{data.displayName}</h1>
          <p className="mt-2 text-sm text-gray-400">{data.legalName} · {data.creatorType === "company" ? "Company / Studio" : "Individual Creator"} · Joined {formatAdminDate(data.joinedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <article className={panelClassName}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Monthly Revenue</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatUsd(data.monthlyRevenueUsd)}</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Published Titles</p>
                <p className="mt-2 text-2xl font-bold text-white">{data.publishedTitles}</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Open Tickets</p>
                <p className="mt-2 text-2xl font-bold text-white">{data.openTickets}</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">DMCA Strikes</p>
                <p className="mt-2 text-2xl font-bold text-white">{data.dmcaStrikes}</p>
              </div>
            </div>
          </article>

          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Profile and contract</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Profile</p>
                <p className="mt-3 text-sm leading-7 text-gray-300">{data.bio}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  <p>Email: {data.email}</p>
                  <p>Phone: {data.phone || "Not provided"}</p>
                  <p>Languages: {data.languages.join(", ")}</p>
                  <p>Genres: {data.genres.join(", ")}</p>
                </div>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Contract</p>
                <div className="mt-3 space-y-2 text-sm text-gray-300">
                  <p>Version: {data.contract.version}</p>
                  <p>Status: {data.contract.status.replaceAll("_", " ")}</p>
                  <p>Signed: {formatAdminDate(data.contract.signedAt)}</p>
                  <p>Next renewal: {formatAdminDate(data.contract.nextRenewalAt)}</p>
                  <p>Managed by: {data.managedBy || "Unassigned"}</p>
                </div>
              </div>
            </div>
          </article>

          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Top dramas</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Title</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Views</th>
                    <th className="pb-3 pr-4 font-medium">Revenue</th>
                    <th className="pb-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topDramas.map((item) => (
                    <tr key={item.id} className="border-b border-gray-800/60">
                      <td className="py-4 pr-4 font-medium text-white">{item.title}</td>
                      <td className="py-4 pr-4 text-gray-400">{item.status.replaceAll("_", " ")}</td>
                      <td className="py-4 pr-4 text-gray-300">{item.views.toLocaleString()}</td>
                      <td className="py-4 pr-4 font-semibold text-white">{formatUsd(item.revenueUsd)}</td>
                      <td className="py-4 text-gray-400">{formatAdminDate(item.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">DMCA and audit trail</h2>
                <p className="text-sm text-gray-400">Keep lifecycle enforcement, strike history, and admin actions in one place.</p>
              </div>
            </div>
            {data.dmcaStrikeHistory.length > 0 ? (
              <div className="mt-5 space-y-3">
                {data.dmcaStrikeHistory.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-white">{item.reason}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "active" ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">Issued {formatAdminDate(item.issuedAt, true)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-gray-700/50 bg-[#0f0f17] p-4 text-sm text-gray-400">No DMCA strikes on record.</div>
            )}

            <div className="mt-5 space-y-3">
              {data.auditTrail.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.action}</p>
                    <span className="text-xs text-gray-500">{formatAdminDate(item.at, true)}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">{item.actor}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-300">{item.summary}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Payout account status</h2>
            <div className="mt-5 rounded-xl bg-[#0f0f17] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{data.bankAccount.bankName || "Beneficiary setup not finished"}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {data.bankAccount.accountHolderName || data.bankAccount.airwallexVerificationResolvedAccountName || data.bankAccount.stripeEmail || "Missing payout owner"}
                    {" · "}
                    {data.bankAccount.maskedAccountNumber || "No external bank account attached"}
                  </p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bankMeta.className}`}>{bankMeta.label}</span>
              </div>
              <p className="mt-3 text-sm text-gray-400">Country: {data.bankAccount.country} · Updated {formatAdminDate(data.bankAccount.updatedAt, true)}</p>
              {data.bankAccount.providerLabel || data.bankAccount.verificationLabel ? (
                <p className="mt-2 text-sm text-indigo-300">{data.bankAccount.providerLabel || "Airwallex Beneficiary"}{data.bankAccount.verificationLabel ? ` · ${data.bankAccount.verificationLabel}` : ""}</p>
              ) : null}
              <div className="mt-4 rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                      {activePayoutProvider === "airwallex" ? "Active payout rail" : activePayoutProvider === "stripe" ? "Stripe payout rail" : "Payout record"}
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {activePayoutProvider === "airwallex" ? "Airwallex beneficiary" : activePayoutProvider === "stripe" ? "Stripe Connect account" : "Manual payout record"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-300">
                    {activePayoutProvider}
                  </span>
                </div>
                <p className="mt-3 text-sm text-white">{getActivePayoutIdentifier(data.bankAccount, activePayoutProvider)}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {activePayoutProvider === "airwallex"
                    ? `${data.bankAccount.airwallexVerificationCode || "Not verified"}${data.bankAccount.airwallexVerificationAccountNameMatchResult ? ` · ${data.bankAccount.airwallexVerificationAccountNameMatchResult}` : ""}`
                    : activePayoutProvider === "stripe"
                      ? data.bankAccount.stripeEmail || "No Stripe email available"
                      : data.bankAccount.verificationLabel || "Manual review"}
                </p>
                {activePayoutProvider === "airwallex" && data.bankAccount.airwallexTransferMethods?.length ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Transfer method: {data.bankAccount.airwallexTransferMethods.join(", ")}
                    {data.bankAccount.airwallexEntityType ? ` · ${data.bankAccount.airwallexEntityType}` : ""}
                  </p>
                ) : null}
              </div>
              {activePayoutProvider === "airwallex" && data.bankAccount.airwallexVerificationResolvedBankName ? (
                <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-sky-200">Airwallex resolved details</p>
                  <p className="mt-2 text-sm leading-6 text-sky-100">
                    {data.bankAccount.airwallexVerificationResolvedBankName}
                    {data.bankAccount.airwallexVerificationResolvedAccountName ? ` · ${data.bankAccount.airwallexVerificationResolvedAccountName}` : ""}
                  </p>
                </div>
              ) : null}
              {activePayoutProvider === "stripe" && data.bankAccount.stripeRequirementsCurrentlyDue?.length ? (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-amber-200">Currently due in Stripe</p>
                  <p className="mt-2 text-sm leading-6 text-amber-100">{data.bankAccount.stripeRequirementsCurrentlyDue.join(", ")}</p>
                </div>
              ) : null}
              {activePayoutProvider === "stripe" && data.bankAccount.stripeDisabledReason ? (
                <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-rose-200">Stripe disabled reason</p>
                  <p className="mt-2 text-sm leading-6 text-rose-100">{data.bankAccount.stripeDisabledReason}</p>
                </div>
              ) : null}
              {hasLegacyStripeRecord ? (
                <div className="mt-4 rounded-xl border border-gray-700/50 bg-[#10101a] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Legacy Stripe record</p>
                  <p className="mt-2 text-sm text-gray-300">
                    Stripe account {data.bankAccount.stripeAccountId} is still stored historically, but payouts now follow the active Airwallex beneficiary above.
                  </p>
                </div>
              ) : null}
              {hasLegacyAirwallexRecord ? (
                <div className="mt-4 rounded-xl border border-gray-700/50 bg-[#10101a] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Legacy Airwallex record</p>
                  <p className="mt-2 text-sm text-gray-300">
                    Airwallex beneficiary {data.bankAccount.airwallexBeneficiaryId} remains on file historically, but the current payout rail is Stripe.
                  </p>
                </div>
              ) : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Link href="/admin/creators/bank-accounts" className="inline-flex items-center justify-center rounded-lg border border-gray-600 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-[#1a1a2e]">
                  Review payout queue
                </Link>
                <Link href="/admin/creators/payout-requests" className="inline-flex items-center justify-center rounded-lg border border-gray-600 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-[#1a1a2e]">
                  Open payout queue
                </Link>
                <button
                  type="button"
                  onClick={handleDeleteBankAccount}
                  disabled={deletingBank}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-500/40 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deletingBank ? "Deleting payout account..." : "Delete payout account"}
                </button>
              </div>
            </div>
          </article>
          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">Account metadata</h2>
            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Creator ID</span>
                <span>{data.id}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Approved at</span>
                <span>{formatAdminDate(data.approvedAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Manager</span>
                <span>{data.managedBy || "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Country</span>
                <span>{data.country}</span>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Link href="/admin/creators/revenue" className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500">
                Open revenue dashboard
              </Link>
              <Link href="/admin/creators/settlements" className="inline-flex items-center rounded-lg border border-gray-600 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-[#1a1a2e]">
                Open settlements
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className={panelClassName}>
        <h2 className="text-lg font-semibold text-white">Admin actions</h2>
        <p className="mt-1 text-sm text-gray-400">Apply lifecycle and level changes after reviewing the creator profile, finance status, and audit history above.</p>
        <div className="mt-5 grid gap-4 xl:grid-cols-[220px_220px_minmax(0,1fr)]">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Lifecycle status</label>
            <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
              <option value="active">Active</option>
              <option value="under_review">Under review</option>
              <option value="restricted">Restricted</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Creator tier</label>
            <select value={nextLevel} onChange={(event) => setNextLevel(event.target.value)} className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500">
              <option value="Rising">Rising</option>
              <option value="Signature">Signature</option>
              <option value="Studio">Studio</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Action note</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Record why the tier or lifecycle status is changing."
              className="min-h-[140px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save creator changes"}
        </button>
      </section>
    </div>
  );
}
