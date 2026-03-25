"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { creatorApi } from "@/lib/api";
import { resolveAirwallexLocale } from "@/lib/airwallex";
import { useToast } from "@/components/ui/Toast";
import type { SupportedLocale } from "@/lib/i18n";
import type { CreatorSettlementAirwallexBeneficiarySummary } from "@/types/creator";

type BeneficiaryElement = {
  mount: (target: string | HTMLElement) => void;
  unmount: () => void;
  destroy: () => void;
  on: (eventCode: string, handler: (eventData?: unknown) => void) => void;
  submit: () => Promise<{
    values?: Record<string, unknown>;
    errors?: { code: string; message?: string };
  }>;
};

type Props = {
  token: string;
  locale: SupportedLocale;
  existingSummary?: CreatorSettlementAirwallexBeneficiarySummary | null;
  existingBeneficiary?: Record<string, unknown> | null;
  existingTransferMethods?: string[];
  onSaved: (summary: CreatorSettlementAirwallexBeneficiarySummary) => void;
  onClose: () => void;
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.code === "string") return obj.code;
    try { return JSON.stringify(error); } catch { /* ignore */ }
  }
  return "Unknown error";
}

export function CreatorAirwallexBeneficiaryForm({
  token,
  locale,
  existingSummary,
  existingBeneficiary,
  existingTransferMethods,
  onSaved,
  onClose,
}: Props) {
  const { toast } = useToast();
  const elementRef = useRef<BeneficiaryElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerIdRef = useRef(`airwallex-beneficiary-form-${Math.random().toString(36).slice(2, 10)}`);
  const fallbackReadyTimerRef = useRef<number | null>(null);
  const iframeProbeTimerRef = useRef<number | null>(null);
  const readyRef = useRef(false);
  const bootstrapIdRef = useRef(0);
  const [booting, setBooting] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bootError, setBootError] = useState<string>("");
  const [sdkState, setSdkState] = useState("Initializing Airwallex...");
  const [sdkDebug, setSdkDebug] = useState<string[]>([]);
  const airwallexLocale = useMemo(() => resolveAirwallexLocale(locale), [locale]);

  const defaultValues = useMemo(() => {
    if (!existingBeneficiary) return undefined;
    return {
      beneficiary: existingBeneficiary,
      transfer_methods: existingTransferMethods?.length ? existingTransferMethods : ["LOCAL"],
    };
  }, [existingBeneficiary, existingTransferMethods]);

  const runBootstrap = useCallback(async (
    cancelled: () => boolean,
    pushDebug: (msg: string) => void,
    setMounted: (el: BeneficiaryElement) => void,
  ) => {
    setBooting(true);
    setBootError("");
    setReady(false);
    readyRef.current = false;
    setSdkState("Requesting embedded auth session...");
    setSdkDebug([]);

    try {
      pushDebug("Requesting embedded auth session...");

      const authResponse = await withTimeout(
        creatorApi.createAirwallexSettlementAuthCode(token),
        15_000,
        "Auth code request",
      );

      if (cancelled()) return;

      const { env, authCode, clientId, codeVerifier, apiVersion } = authResponse.data;
      pushDebug(`Auth code received (${env} environment, locale ${airwallexLocale}).`);
      setSdkState("Loading Airwallex SDK...");

      const sdk = await withTimeout(
        import("@airwallex/components-sdk"),
        20_000,
        "SDK module import",
      );

      if (cancelled()) return;

      pushDebug("SDK module loaded, initializing...");
      setSdkState("Initializing SDK...");

      await withTimeout(
        sdk.init({
          env,
          locale: airwallexLocale,
          enabledElements: ["payouts"],
          authCode,
          clientId,
          codeVerifier,
        }),
        30_000,
        "SDK initialization",
      );

      if (cancelled()) return;
      pushDebug(`SDK initialized (API ${apiVersion}, locale ${airwallexLocale}).`);
      setSdkState("Creating beneficiary form...");

      const element = (await withTimeout(
        sdk.createElement("beneficiaryForm", {
          locale: airwallexLocale,
          apiVersion,
          defaultValues: defaultValues as never,
          customizations: {
            fields: {
              nickname: { hidden: true },
            },
            ui: {
              hideOptionalFields: false,
            },
            minHeight: 720,
          },
        }),
        20_000,
        "Beneficiary form creation",
      )) as unknown as BeneficiaryElement;

      if (!element) {
        throw new Error("Airwallex beneficiary component was not created.");
      }

      if (cancelled()) {
        element.destroy();
        return;
      }

      setMounted(element);
      element.on("ready", () => {
        if (cancelled()) return;
        pushDebug("Beneficiary form reported ready.");
        setSdkState("Beneficiary form ready.");
        readyRef.current = true;
        setReady(true);
      });
      element.on("error", (eventData) => {
        if (cancelled()) return;
        const nextError = extractErrorMessage(eventData);
        pushDebug(`SDK error: ${nextError}`);
        if (nextError && nextError !== "Unknown error") {
          setBootError(nextError);
        }
      });
      element.on("formState", (eventData) => {
        if (cancelled() || !eventData || typeof eventData !== "object") return;
        const payload = eventData as { loading?: boolean; validation?: boolean; errors?: { message?: string } };
        setSdkState(payload.loading ? "Loading beneficiary fields..." : "Beneficiary form mounted.");
        if (payload.errors?.message) {
          pushDebug(`Form state: ${payload.errors.message}`);
        }
      });

      if (!containerRef.current || !document.getElementById(containerIdRef.current)) {
        throw new Error("Airwallex beneficiary container is not mounted.");
      }

      pushDebug("Mounting beneficiary form iframe...");
      setSdkState("Mounting beneficiary form...");
      element.mount(`#${containerIdRef.current}`);
      elementRef.current = element;

      fallbackReadyTimerRef.current = window.setTimeout(() => {
        if (!cancelled() && containerRef.current?.querySelector("iframe")) {
          pushDebug("Iframe detected before ready event.");
          readyRef.current = true;
          setReady(true);
          setSdkState("Beneficiary form mounted.");
        }
      }, 3_000);

      iframeProbeTimerRef.current = window.setTimeout(() => {
        if (cancelled() || readyRef.current) return;
        const hasIframe = Boolean(containerRef.current?.querySelector("iframe"));
        if (!hasIframe) {
          setBootError(
            "Airwallex beneficiary iframe did not appear. This may be caused by a network issue or browser extension blocking the embedded component.",
          );
          pushDebug("No iframe found in beneficiary container after mount.");
          return;
        }

        pushDebug("Iframe exists but ready event has not fired yet.");
        setSdkState("Waiting for Airwallex form to finish loading...");
      }, 6_000);
    } catch (error) {
      if (!cancelled()) {
        const message = extractErrorMessage(error);
        pushDebug(message);
        setBootError(message);
      }
    } finally {
      if (!cancelled()) {
        setBooting(false);
      }
    }
  }, [airwallexLocale, defaultValues, token]);

  useEffect(() => {
    const runId = ++bootstrapIdRef.current;
    const currentBootstrapId = runId;
    let mountedElement: BeneficiaryElement | null = null;

    const cancelled = () => runId !== bootstrapIdRef.current;
    const pushDebug = (message: string) => {
      if (cancelled()) return;
      setSdkDebug((current) => [...current.slice(-9), message]);
    };

    runBootstrap(cancelled, pushDebug, (el) => { mountedElement = el; });

    return () => {
      if (bootstrapIdRef.current === currentBootstrapId) {
        bootstrapIdRef.current++;
      }
      if (fallbackReadyTimerRef.current) {
        window.clearTimeout(fallbackReadyTimerRef.current);
      }
      if (iframeProbeTimerRef.current) {
        window.clearTimeout(iframeProbeTimerRef.current);
      }
      mountedElement?.destroy();
      elementRef.current = null;
    };
  }, [runBootstrap]);

  async function handleSave() {
    if (!elementRef.current) {
      toast("Airwallex beneficiary form is not ready yet.", "info");
      return;
    }

    setSaving(true);
    try {
      const result = await elementRef.current.submit();
      if (result.errors?.code) {
        throw new Error(result.errors.message || result.errors.code);
      }
      if (!result.values) {
        throw new Error("Airwallex did not return beneficiary values.");
      }

      const response = existingSummary?.beneficiaryId
        ? await creatorApi.updateAirwallexSettlementBeneficiary(token, existingSummary.beneficiaryId, result.values)
        : await creatorApi.createAirwallexSettlementBeneficiary(token, result.values);

      onSaved(response.data.summary);
      toast("Airwallex payout account saved.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save Airwallex payout account.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-[#d9e9ff] bg-[linear-gradient(180deg,#f4f9ff,#ffffff)] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1876f2]">Airwallex</p>
          <h3 className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-[#0f172a]">
            {existingSummary?.beneficiaryId ? "Edit payout beneficiary" : "Create payout beneficiary"}
          </h3>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] border border-[#dbe3ec] bg-white p-4">
        {locale !== airwallexLocale ? (
          <div className="mb-4 rounded-2xl border border-[#dbe3ec] bg-[#f8fafc] px-3 py-3 text-[12px] leading-5 text-[#64748b]">
            Airwallex currently displays this payout form in English for the selected page language.
          </div>
        ) : null}
        {!ready ? (
          <div className="mb-4">
            {bootError ? (
              <div className="space-y-3 rounded-[18px] border border-[#fecaca] bg-[#fff1f2] px-4 py-4 text-sm text-[#9f1239]">
                <p>{bootError}</p>
                {sdkDebug.length ? (
                  <div className="rounded-2xl bg-white/80 px-3 py-3 text-[12px] leading-5 text-[#7f1d1d]">
                    {sdkDebug.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex min-h-[48px] items-center gap-2 text-sm font-semibold text-[#475569]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#1876f2]" />
                  {sdkState}
                </div>
                {sdkDebug.length > 0 ? (
                  <div className="rounded-2xl border border-[#dbe3ec] bg-[#f8fafc] px-3 py-3 text-[12px] leading-5 text-[#475569]">
                    {sdkDebug.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
        <div
          id={containerIdRef.current}
          ref={containerRef}
          className="min-h-[640px]"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={booting || saving || Boolean(bootError)}
          className="inline-flex h-11 items-center rounded-2xl bg-[#1876f2] px-5 text-[14px] font-bold text-white transition hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : existingSummary?.beneficiaryId ? (
            "Save beneficiary changes"
          ) : (
            "Save payout beneficiary"
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center rounded-2xl border border-[#dbe3ec] bg-white px-5 text-[14px] font-semibold text-[#334155] transition hover:bg-[#f8fafc]"
        >
          Close form
        </button>
      </div>
    </div>
  );
}
