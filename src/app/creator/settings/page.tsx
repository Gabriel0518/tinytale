"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpenText,
  Camera,
  CreditCard,
  Globe2,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  MonitorCog,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { creatorApi, profileApi, settingsApi } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { deserializeCreatorApplicationDraft } from "@/lib/creator";
import { useToast } from "@/components/ui/Toast";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "hi", label: "Hindi" },
  { value: "other", label: "Other" },
] as const;

const ANALYTICS_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
] as const;

type CreatorSettingsPayload = {
  creator?: {
    profile?: {
      bio?: string;
      twitter?: string;
      instagram?: string;
      portfolioUrl?: string;
      primaryLanguage?: string;
      genreFocus?: string;
      publicContactEmail?: string;
    };
    notifications?: {
      ticketReplies?: boolean;
      performanceDigest?: boolean;
      releaseReview?: boolean;
      settlementUpdates?: boolean;
      marketingAnnouncements?: boolean;
    };
    workspace?: {
      defaultAnalyticsRange?: "7d" | "30d" | "90d";
      emailLanguage?: string;
      timezone?: string;
      compactTables?: boolean;
      autoplayPreview?: boolean;
    };
  };
};

type CreatorSettingsResponse = {
  language?: string;
  creator?: {
    profile?: {
      bio?: string;
      twitter?: string;
      instagram?: string;
      portfolioUrl?: string;
      primaryLanguage?: string;
      genreFocus?: string;
      publicContactEmail?: string;
    };
    notifications?: {
      ticketReplies?: boolean;
      performanceDigest?: boolean;
      releaseReview?: boolean;
      settlementUpdates?: boolean;
      marketingAnnouncements?: boolean;
    };
    workspace?: {
      defaultAnalyticsRange?: "7d" | "30d" | "90d";
      emailLanguage?: string;
      timezone?: string;
      compactTables?: boolean;
      autoplayPreview?: boolean;
    };
  };
};

type SecuritySession = {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
};

type ProfileFormState = {
  avatar: string;
  displayName: string;
  bio: string;
  twitter: string;
  instagram: string;
  portfolioUrl: string;
  primaryLanguage: string;
  genreFocus: string;
  publicContactEmail: string;
};

type NotificationFormState = {
  ticketReplies: boolean;
  performanceDigest: boolean;
  releaseReview: boolean;
  settlementUpdates: boolean;
  marketingAnnouncements: boolean;
};

type WorkspaceFormState = {
  defaultAnalyticsRange: "7d" | "30d" | "90d";
  emailLanguage: string;
  timezone: string;
  compactTables: boolean;
  autoplayPreview: boolean;
};

type SavingState = {
  profile: boolean;
  profileDetails: boolean;
  notifications: boolean;
  workspace: boolean;
  password: boolean;
  avatar: boolean;
};

const cardClassName =
  "rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]";
const inputClassName =
  "h-[50px] w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 text-[15px] text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1876f2] focus:ring-4 focus:ring-[rgba(24,118,242,0.12)]";
const textareaClassName =
  "min-h-[112px] w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3 text-[15px] text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1876f2] focus:ring-4 focus:ring-[rgba(24,118,242,0.12)]";

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${cardClassName} p-6 md:p-8`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(24,118,242,0.1)] text-[#1876f2]">
          {icon}
        </div>
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#0f172a]">{title}</h2>
          {description ? <p className="mt-1 text-[14px] leading-6 text-[#64748b]">{description}</p> : null}
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-[14px] font-semibold text-[#0f172a]">{children}</label>;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition ${
        checked ? "bg-[#1876f2]" : "bg-[#dbe3ec]"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      aria-pressed={checked}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(15,23,42,0.18)] transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SaveButton({
  label,
  loading,
}: {
  label: string;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#1876f2] px-6 text-[15px] font-bold text-white transition hover:bg-[#1669da] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </button>
  );
}

function formatSessionTime(value: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function CreatorSettingsPage() {
  const locale = useLocale();
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    avatar: "",
    displayName: "",
    bio: "",
    twitter: "",
    instagram: "",
    portfolioUrl: "",
    primaryLanguage: "en",
    genreFocus: "",
    publicContactEmail: "",
  });
  const [notificationForm, setNotificationForm] = useState<NotificationFormState>({
    ticketReplies: true,
    performanceDigest: true,
    releaseReview: true,
    settlementUpdates: true,
    marketingAnnouncements: false,
  });
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceFormState>({
    defaultAnalyticsRange: "30d",
    emailLanguage: "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    compactTables: true,
    autoplayPreview: false,
  });
  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState<SavingState>({
    profile: false,
    profileDetails: false,
    notifications: false,
    workspace: false,
    password: false,
    avatar: false,
  });

  const currentSession = useMemo(
    () => sessions.find((session) => session.isCurrent) || sessions[0] || null,
    [sessions]
  );

  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    const authToken: string = token;
    const currentUser = user;

    let cancelled = false;

    async function hydrate() {
      setLoading(true);
      try {
        const [settingsResult, securityResult, draftResult] = await Promise.allSettled([
          settingsApi.getSettings(authToken),
          settingsApi.getSecurity(authToken),
          creatorApi.getApplicationDraft(authToken),
        ]);

        if (cancelled) return;

        const settingsData: CreatorSettingsResponse =
          settingsResult.status === "fulfilled" && settingsResult.value?.success
            ? settingsResult.value.data || {}
            : {};
        const securityData =
          securityResult.status === "fulfilled" && securityResult.value?.success
            ? securityResult.value.data || {}
            : {};
        const draft =
          draftResult.status === "fulfilled" && draftResult.value?.success
            ? deserializeCreatorApplicationDraft(draftResult.value)
            : null;

        const creatorProfile = settingsData.creator?.profile || {};
        const creatorNotifications = settingsData.creator?.notifications || {};
        const creatorWorkspace = settingsData.creator?.workspace || {};

        setProfileForm({
          avatar: currentUser.avatar || "",
          displayName: currentUser.nickname || "",
          bio: creatorProfile.bio || draft?.creativeInformation.bio || "",
          twitter: creatorProfile.twitter || "",
          instagram: creatorProfile.instagram || "",
          portfolioUrl:
            creatorProfile.portfolioUrl
            || draft?.creativeInformation.portfolioLinks.find((value) => value.trim())
            || "",
          primaryLanguage:
            creatorProfile.primaryLanguage
            || draft?.creativeInformation.primaryLanguage
            || settingsData.language
            || "en",
          genreFocus:
            creatorProfile.genreFocus
            || draft?.creativeInformation.genres.join(", ")
            || "",
          publicContactEmail:
            creatorProfile.publicContactEmail
            || draft?.basicInformation.email
            || currentUser.email
            || "",
        });

        setNotificationForm({
          ticketReplies: Boolean(creatorNotifications.ticketReplies ?? true),
          performanceDigest: Boolean(creatorNotifications.performanceDigest ?? true),
          releaseReview: Boolean(creatorNotifications.releaseReview ?? true),
          settlementUpdates: Boolean(creatorNotifications.settlementUpdates ?? true),
          marketingAnnouncements: Boolean(creatorNotifications.marketingAnnouncements ?? false),
        });

        setWorkspaceForm({
          defaultAnalyticsRange: creatorWorkspace.defaultAnalyticsRange || "30d",
          emailLanguage: creatorWorkspace.emailLanguage || settingsData.language || "en",
          timezone: creatorWorkspace.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          compactTables: Boolean(creatorWorkspace.compactTables ?? true),
          autoplayPreview: Boolean(creatorWorkspace.autoplayPreview ?? false),
        });

        setSessions(Array.isArray(securityData.sessions) ? securityData.sessions : []);
        setTwoFactorEnabled(Boolean(securityData.twoFactorEnabled));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [token, user]);

  const persistSettings = async (payload: CreatorSettingsPayload, successMessage: string) => {
    if (!token) return;
    await settingsApi.updateSettings(token, payload);
    toast(successMessage, "success");
  };

  const handleAvatarSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    if (!file.type.startsWith("image/")) {
      toast("Only JPG and PNG images are supported.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast("Image size must be 2MB or smaller.", "error");
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, avatar: true }));
      const result = await creatorApi.uploadImageFile(token, file);
      setProfileForm((prev) => ({ ...prev, avatar: result.data.url }));
      toast("Profile image uploaded. Save changes to publish it.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to upload image.", "error");
    } finally {
      setSaving((prev) => ({ ...prev, avatar: false }));
      if (event.target) event.target.value = "";
    }
  };

  const handleSavePublicProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !user) return;

    const displayName = profileForm.displayName.trim();
    if (!displayName) {
      toast("Display name is required.", "error");
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, profile: true }));
      await Promise.all([
        profileApi.update(token, { nickname: displayName, avatar: profileForm.avatar }),
        settingsApi.updateSettings(token, {
          creator: {
            profile: {
              bio: profileForm.bio.trim(),
              twitter: profileForm.twitter.trim(),
              instagram: profileForm.instagram.trim(),
            },
          },
        }),
      ]);

      updateUser({ ...user, nickname: displayName, avatar: profileForm.avatar });
      toast("Public profile updated.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save public profile.", "error");
    } finally {
      setSaving((prev) => ({ ...prev, profile: false }));
    }
  };

  const handleSaveProfileDetails = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving((prev) => ({ ...prev, profileDetails: true }));
      await persistSettings(
        {
          creator: {
            profile: {
              portfolioUrl: profileForm.portfolioUrl.trim(),
              primaryLanguage: profileForm.primaryLanguage,
              genreFocus: profileForm.genreFocus.trim(),
              publicContactEmail: profileForm.publicContactEmail.trim(),
            },
          },
        },
        "Creator profile details saved."
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save creator details.", "error");
    } finally {
      setSaving((prev) => ({ ...prev, profileDetails: false }));
    }
  };

  const handleSaveNotifications = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving((prev) => ({ ...prev, notifications: true }));
      await persistSettings({ creator: { notifications: notificationForm } }, "Notification preferences saved.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save notification preferences.", "error");
    } finally {
      setSaving((prev) => ({ ...prev, notifications: false }));
    }
  };

  const handleSaveWorkspace = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving((prev) => ({ ...prev, workspace: true }));
      await persistSettings({ creator: { workspace: workspaceForm } }, "Workspace preferences saved.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save workspace preferences.", "error");
    } finally {
      setSaving((prev) => ({ ...prev, workspace: false }));
    }
  };

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast("Current password and new password are required.", "error");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast("New password must be at least 8 characters.", "error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast("Password confirmation does not match.", "error");
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, password: true }));
      await profileApi.changePassword(token, passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast("Password updated successfully.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to change password.", "error");
    } finally {
      setSaving((prev) => ({ ...prev, password: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 text-sm font-semibold text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <Loader2 className="h-4 w-4 animate-spin text-[#1876f2]" />
          Loading account settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 xl:space-y-7">
      <section className="flex flex-col gap-3 rounded-[28px] bg-[#eef3f8] px-6 py-6 md:px-8 md:py-8">
        <div className="inline-flex w-fit items-center rounded-full bg-white/80 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1876f2] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          Creator Center
        </div>
        <div>
          <h1 className="text-[34px] font-black tracking-[-0.04em] text-[#0f172a] md:text-[40px]">Account Settings</h1>
          <p className="mt-2 max-w-[880px] text-[16px] leading-7 text-[#64748b] md:text-[18px]">
            Manage your creator profile, notifications, workspace defaults, and security preferences from one control center.
          </p>
        </div>
      </section>

      <SectionCard
        icon={<UserCircle2 className="h-5 w-5" />}
        title="Public Profile"
        description="The layout and spacing follow the Figma settings spec. Editable payment information has been removed from this area and moved under Settlements."
      >
        <form className="grid gap-8 xl:grid-cols-[160px_minmax(0,1fr)]" onSubmit={handleSavePublicProfile}>
          <div>
            <FieldLabel>Profile Picture</FieldLabel>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative mt-1 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-[#f8fafc] shadow-[0_0_0_4px_#f1f5f9]"
            >
              {profileForm.avatar ? (
                <Image
                  src={profileForm.avatar}
                  alt={profileForm.displayName || "Creator avatar"}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#bfdbfe,#eff6ff)] text-[34px] font-black text-[#1d4ed8]">
                  {(profileForm.displayName || user?.nickname || "C").slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-[rgba(15,23,42,0.38)] text-white opacity-0 transition group-hover:opacity-100">
                {saving.avatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </span>
            </button>
            <p className="mt-4 text-[12px] leading-5 text-[#64748b]">JPG or PNG. Max 2MB.</p>
          </div>

          <div className="space-y-5">
            <div>
              <FieldLabel>Display Name</FieldLabel>
              <input
                className={inputClassName}
                value={profileForm.displayName}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
                maxLength={40}
                placeholder="TinyTale Creator"
              />
            </div>

            <div>
              <FieldLabel>Bio</FieldLabel>
              <textarea
                className={textareaClassName}
                value={profileForm.bio}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                maxLength={1000}
                placeholder="Introduce your creative voice, genres, and current production focus."
              />
              <p className="mt-2 text-right text-[12px] text-[#94a3b8]">{profileForm.bio.length} / 1000</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>X (Twitter)</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#94a3b8]">@</span>
                  <input
                    className={`${inputClassName} pl-8`}
                    value={profileForm.twitter}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, twitter: event.target.value.replace(/^@+/, "") }))}
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Instagram</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#94a3b8]">@</span>
                  <input
                    className={`${inputClassName} pl-8`}
                    value={profileForm.instagram}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, instagram: event.target.value.replace(/^@+/, "") }))}
                    placeholder="username"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <SaveButton label="Save Changes" loading={saving.profile} />
            </div>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <SectionCard
          icon={<BookOpenText className="h-5 w-5" />}
          title="Creator Identity Details"
          description="Supplemental profile fields were added based on the creator docs so operations, review, and future discovery surfaces stay aligned."
        >
          <form className="space-y-5" onSubmit={handleSaveProfileDetails}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Portfolio URL</FieldLabel>
                <input
                  className={inputClassName}
                  value={profileForm.portfolioUrl}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, portfolioUrl: event.target.value }))}
                  placeholder="https://portfolio.example.com"
                />
              </div>
              <div>
                <FieldLabel>Primary Language</FieldLabel>
                <select
                  className={inputClassName}
                  value={profileForm.primaryLanguage}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, primaryLanguage: event.target.value }))}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Genre Focus</FieldLabel>
                <input
                  className={inputClassName}
                  value={profileForm.genreFocus}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, genreFocus: event.target.value }))}
                  placeholder="Romance, urban fantasy, suspense"
                />
              </div>
              <div>
                <FieldLabel>Public Contact Email</FieldLabel>
                <input
                  className={inputClassName}
                  type="email"
                  value={profileForm.publicContactEmail}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, publicContactEmail: event.target.value }))}
                  placeholder="creator@studio.com"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <SaveButton label="Save Details" loading={saving.profileDetails} />
            </div>
          </form>
        </SectionCard>

        <SectionCard
          icon={<CreditCard className="h-5 w-5" />}
          title="Settlement Center"
          description="Bank account, payout method, tax materials, and payout proof now belong to the financial settlement module."
        >
          <div className="rounded-[20px] bg-[#f8fafc] p-4">
            <div className="flex items-start justify-between gap-4 rounded-[18px] border border-[#e2e8f0] bg-white p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#1876f2]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[16px] font-bold text-[#0f172a]">USD Settlement & Bank Setup</p>
                    <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[12px] font-semibold text-[#166534]">
                      Managed in Settlements
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] leading-6 text-[#64748b]">
                    Configure bank details, view payout readiness, and track remittance proofs inside the dedicated settlement workflow.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold text-[#475569]">
                    <span className="rounded-full bg-white px-3 py-1 shadow-[inset_0_0_0_1px_#e2e8f0]">Currency: USD</span>
                    <span className="rounded-full bg-white px-3 py-1 shadow-[inset_0_0_0_1px_#e2e8f0]">Method: Bank transfer</span>
                    <span className="rounded-full bg-white px-3 py-1 shadow-[inset_0_0_0_1px_#e2e8f0]">Verification required</span>
                  </div>
                </div>
              </div>
              <Link
                href={localizePath("/creator/settlements", locale)}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#1876f2] px-5 text-[14px] font-bold text-white transition hover:bg-[#1669da]"
              >
                Open Module
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          icon={<Bell className="h-5 w-5" />}
          title="Notification Preferences"
          description="These alerts cover the creator workflows that matter operationally: tickets, reviews, analytics, and settlements."
        >
          <form className="space-y-4" onSubmit={handleSaveNotifications}>
            {[
              {
                key: "ticketReplies" as const,
                title: "Ticket Replies",
                description: "Get notified when creator support responds or needs more information.",
              },
              {
                key: "performanceDigest" as const,
                title: "Performance Digest",
                description: "Receive regular summaries for reads, revenue, and audience movement.",
              },
              {
                key: "releaseReview" as const,
                title: "Drama Review Updates",
                description: "Stay informed about content review, approval, rejection, and revision requests.",
              },
              {
                key: "settlementUpdates" as const,
                title: "Settlement Updates",
                description: "Alerts for statement generation, payout holds, and remittance completion.",
              },
              {
                key: "marketingAnnouncements" as const,
                title: "Program Announcements",
                description: "Optional updates about creator campaigns, incentives, and product rollouts.",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] px-4 py-4">
                <div>
                  <p className="text-[15px] font-semibold text-[#0f172a]">{item.title}</p>
                  <p className="mt-1 text-[13px] leading-6 text-[#64748b]">{item.description}</p>
                </div>
                <Toggle
                  checked={notificationForm[item.key]}
                  onChange={(value) => setNotificationForm((prev) => ({ ...prev, [item.key]: value }))}
                />
              </div>
            ))}

            <div className="flex justify-end">
              <SaveButton label="Save Preferences" loading={saving.notifications} />
            </div>
          </form>
        </SectionCard>

        <SectionCard
          icon={<MonitorCog className="h-5 w-5" />}
          title="Workspace Preferences"
          description="Default analytics scope and operating density for the creator console."
        >
          <form className="space-y-5" onSubmit={handleSaveWorkspace}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Default Analytics Range</FieldLabel>
                <select
                  className={inputClassName}
                  value={workspaceForm.defaultAnalyticsRange}
                  onChange={(event) =>
                    setWorkspaceForm((prev) => ({
                      ...prev,
                      defaultAnalyticsRange: event.target.value as WorkspaceFormState["defaultAnalyticsRange"],
                    }))
                  }
                >
                  {ANALYTICS_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Email Language</FieldLabel>
                <select
                  className={inputClassName}
                  value={workspaceForm.emailLanguage}
                  onChange={(event) => setWorkspaceForm((prev) => ({ ...prev, emailLanguage: event.target.value }))}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel>Timezone</FieldLabel>
              <div className="relative">
                <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  className={`${inputClassName} pl-11`}
                  value={workspaceForm.timezone}
                  onChange={(event) => setWorkspaceForm((prev) => ({ ...prev, timezone: event.target.value }))}
                  placeholder="Asia/Shanghai"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-[#0f172a]">Compact Table Density</p>
                    <p className="mt-1 text-[13px] leading-6 text-[#64748b]">Keep drama, analytics, and ticket tables in the tighter creator-center density.</p>
                  </div>
                  <Toggle
                    checked={workspaceForm.compactTables}
                    onChange={(value) => setWorkspaceForm((prev) => ({ ...prev, compactTables: value }))}
                  />
                </div>
              </div>

              <div className="rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-[#0f172a]">Autoplay Dashboard Previews</p>
                    <p className="mt-1 text-[13px] leading-6 text-[#64748b]">Enable small visual previews when future dashboard widgets support it.</p>
                  </div>
                  <Toggle
                    checked={workspaceForm.autoplayPreview}
                    onChange={(value) => setWorkspaceForm((prev) => ({ ...prev, autoplayPreview: value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <SaveButton label="Save Workspace" loading={saving.workspace} />
            </div>
          </form>
        </SectionCard>
      </div>

      <SectionCard
        icon={<LockKeyhole className="h-5 w-5" />}
        title="Security & Access"
        description="Password updates live here. Bank verification and payment methods have been removed from settings and centralized in Settlements."
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,1.05fr)]">
          <div className="space-y-4">
            <div className="rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(24,118,242,0.1)] text-[#1876f2]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#0f172a]">Two-Factor Authentication</p>
                  <p className="text-[13px] leading-6 text-[#64748b]">
                    {twoFactorEnabled ? "Enabled for this account." : "Not enabled yet. Advanced access controls will be expanded later."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold text-[#0f172a]">Current Session</p>
                  <p className="mt-1 text-[13px] leading-6 text-[#64748b]">
                    {currentSession
                      ? `${currentSession.device} · ${currentSession.ip} · ${formatSessionTime(currentSession.lastActive)}`
                      : "Session details are not available yet."}
                  </p>
                </div>
                <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-[12px] font-semibold text-[#1d4ed8]">
                  {sessions.length} active
                </span>
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handlePasswordChange}>
            <div>
              <FieldLabel>Current Password</FieldLabel>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  className={`${inputClassName} pl-11`}
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>New Password</FieldLabel>
                <input
                  className={inputClassName}
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <FieldLabel>Confirm Password</FieldLabel>
                <input
                  className={inputClassName}
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <div className="rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] px-4 py-3 text-[13px] leading-6 text-[#64748b]">
              Password changes apply to your TinyTale account immediately. Financial settlement permissions remain controlled in the settlement module and internal review workflows.
            </div>

            <div className="flex justify-end">
              <SaveButton label="Update Password" loading={saving.password} />
            </div>
          </form>
        </div>
      </SectionCard>

      <footer className="flex items-center justify-center gap-2 px-4 pb-2 pt-1 text-[13px] text-[#94a3b8]">
        <Mail className="h-4 w-4" />
        Need payout or contract help? Use Creator Tickets for auditable support requests.
      </footer>
    </div>
  );
}
