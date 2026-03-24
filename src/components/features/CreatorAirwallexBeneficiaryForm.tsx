"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { creatorApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
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
  existingSummary?: CreatorSettlementAirwallexBeneficiarySummary | null;
  existingBeneficiary?: Record<string, unknown> | null;
  existingTransferMethods?: string[];
  onSaved: (summary: CreatorSettlementAirwallexBeneficiarySummary) => void;
  onClose: () => void;
};

export function CreatorAirwallexBeneficiaryForm({
  token,
  existingSummary,
  existingBeneficiary,
  existingTransferMethods,
  onSaved,
  onClose,
}: Props) {
  const { toast } = useToast();
  const elementRef = useRef<BeneficiaryElement | null>(null);
  const fallbackReadyTimerRef = useRef<number | null>(null);
  const containerId = useId().replace(/:/g, "-");
  const [booting, setBooting] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bootError, setBootError] = useState<string>("");

  const defaultValues = useMemo(() => {
    if (!existingBeneficiary) return undefined;
    return {
      beneficiary: existingBeneficiary,
      transfer_methods: existingTransferMethods?.length ? existingTransferMethods : ["LOCAL"],
    };
  }, [existingBeneficiary, existingTransferMethods]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setBooting(true);
      setBootError("");
      setReady(false);

      try {
        const [{ init, createElement }, authResponse] = await Promise.all([
          import("@airwallex/components-sdk"),
          creatorApi.createAirwallexSettlementAuthCode(token),
        ]);

        if (cancelled) return;

        await init({
          env: authResponse.data.env,
          locale: "en",
          enabledElements: ["beneficiaryForm"],
          authCode: authResponse.data.authCode,
          clientId: authResponse.data.clientId,
          codeVerifier: authResponse.data.codeVerifier,
        });

        if (cancelled) return;

        const element = (await createElement("beneficiaryForm", {
          locale: "en",
          apiVersion: "2024-09-27",
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
        })) as unknown as BeneficiaryElement;

        if (cancelled) {
          element.destroy();
          return;
        }

        element.on("ready", () => {
          if (!cancelled) setReady(true);
        });
        element.on("error", (eventData) => {
          if (cancelled) return;
          const nextError =
            typeof eventData === "object" && eventData && "message" in (eventData as Record<string, unknown>)
              ? String((eventData as Record<string, unknown>).message || "")
              : "";
          if (nextError) {
            setBootError(nextError);
          }
        });

        element.mount(containerId);
        elementRef.current = element;
        setReady(true);

        fallbackReadyTimerRef.current = window.setTimeout(() => {
          if (!cancelled) {
            setReady(true);
          }
        }, 2500);
      } catch (error) {
        if (!cancelled) {
          setBootError(error instanceof Error ? error.message : "Failed to initialize Airwallex beneficiary form.");
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      if (fallbackReadyTimerRef.current) {
        window.clearTimeout(fallbackReadyTimerRef.current);
      }
      elementRef.current?.destroy();
      elementRef.current = null;
    };
  }, [containerId, defaultValues, token]);

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
        {booting ? (
          <div className="flex min-h-[360px] items-center justify-center gap-3 text-sm font-semibold text-[#475569]">
            <Loader2 className="h-4 w-4 animate-spin text-[#1876f2]" />
            Loading Airwallex beneficiary form...
          </div>
        ) : bootError ? (
          <div className="rounded-[18px] border border-[#fecaca] bg-[#fff1f2] px-4 py-4 text-sm text-[#9f1239]">
            {bootError}
          </div>
        ) : (
          <div>
            {!ready ? (
              <div className="mb-4 flex items-center gap-2 text-sm text-[#64748b]">
                <Loader2 className="h-4 w-4 animate-spin text-[#1876f2]" />
                Preparing beneficiary fields...
              </div>
            ) : null}
            <div id={containerId} className="min-h-[640px]" />
          </div>
        )}
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
