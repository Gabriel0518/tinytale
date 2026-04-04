"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { settingsApi, userApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { useToast } from "@/components/ui/Toast";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import {
  IN_APP_NOTIFICATIONS_EVENT,
  InAppNotificationItem,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  mergeInAppNotifications,
  readInAppNotifications,
  resolveInAppNotificationHref,
} from "@/lib/in-app-notifications";
import { readRuntimeSettings, RUNTIME_SETTINGS_EVENT, RuntimeSettingsSnapshot } from "@/lib/runtime-settings";

type NotificationsCopy = {
  title: string;
  markAllRead: string;
  noNotifications: string;
  watchNow: string;
  connectedDevice: string;
  pushDisabled: string;
  pushEnabled: string;
  localInbox: string;
  justNow: string;
  open: string;
  openSettings: string;
  watchEpisode: string;
  lastSynced: string;
  localPush: string;
  syncedInbox: string;
  testPush: string;
  testPushSending: string;
  testPushSuccess: string;
  testPushMissingDevice: string;
  testPushUnavailable: string;
  serverReady: string;
  serverMissing: string;
  devicesLabel: string;
  hoursAgo: (h: number) => string;
  daysAgo: (d: number) => string;
};

const COPY: FlexibleRecord<SupportedLocale, NotificationsCopy> = {
  en: {
    title: "Notifications",
    markAllRead: "Mark all as read",
    noNotifications: "No notifications yet",
    watchNow: "Watch now",
    connectedDevice: "Connected device",
    pushDisabled: "Push notifications are currently disabled on this device.",
    pushEnabled: "App notifications are connected and will appear here in real time.",
    localInbox: "App inbox",
    justNow: "Just now",
    open: "Open",
    openSettings: "Manage settings",
    watchEpisode: "Resume episode",
    lastSynced: "Last synced",
    localPush: "Local push",
    syncedInbox: "Synced inbox",
    testPush: "Send test push",
    testPushSending: "Sending...",
    testPushSuccess: "Test push sent.",
    testPushMissingDevice: "No registered device found yet.",
    testPushUnavailable: "Firebase push is not configured on the server.",
    serverReady: "Server ready",
    serverMissing: "Server config missing",
    devicesLabel: "Devices",
    hoursAgo: (h) => `${h}h ago`,
    daysAgo: (d) => `${d}d ago` },
  zh: {
    title: "通知",
    markAllRead: "全部标为已读",
    noNotifications: "暂无通知",
    watchNow: "立即观看",
    connectedDevice: "已连接设备",
    pushDisabled: "当前设备已关闭推送通知。",
    pushEnabled: "App 内通知已接通，前台收到的消息会实时显示在这里。",
    localInbox: "应用收件箱",
    justNow: "刚刚",
    open: "打开",
    openSettings: "管理设置",
    watchEpisode: "继续本集",
    lastSynced: "最近同步",
    localPush: "本地推送",
    syncedInbox: "云端同步",
    testPush: "发送测试推送",
    testPushSending: "发送中...",
    testPushSuccess: "测试推送已发送。",
    testPushMissingDevice: "当前还没有已注册设备。",
    testPushUnavailable: "服务器尚未配置 Firebase 推送。",
    serverReady: "服务端已就绪",
    serverMissing: "服务端未配置",
    devicesLabel: "设备数",
    hoursAgo: (h) => `${h}小时前`,
    daysAgo: (d) => `${d}天前` },
  ja: {
    title: "通知",
    markAllRead: "すべて既読にする",
    noNotifications: "通知はまだありません",
    watchNow: "今すぐ視聴",
    connectedDevice: "接続済みデバイス",
    pushDisabled: "この端末ではプッシュ通知が無効です。",
    pushEnabled: "アプリ通知は接続済みで、受信した通知がここに反映されます。",
    localInbox: "アプリ受信箱",
    justNow: "たった今",
    open: "開く",
    openSettings: "設定を管理",
    watchEpisode: "エピソードを再開",
    lastSynced: "最終同期",
    localPush: "ローカルプッシュ",
    syncedInbox: "同期済み受信箱",
    testPush: "テスト通知を送信",
    testPushSending: "送信中...",
    testPushSuccess: "テスト通知を送信しました。",
    testPushMissingDevice: "登録済みデバイスがまだありません。",
    testPushUnavailable: "サーバーで Firebase push が未設定です。",
    serverReady: "サーバー準備完了",
    serverMissing: "サーバー未設定",
    devicesLabel: "デバイス数",
    hoursAgo: (h) => `${h}時間前`,
    daysAgo: (d) => `${d}日前` },
  es: {
    title: "Notificaciones",
    markAllRead: "Marcar todo como leído",
    noNotifications: "Aún no hay notificaciones",
    watchNow: "Ver ahora",
    connectedDevice: "Dispositivo conectado",
    pushDisabled: "Las notificaciones push están desactivadas en este dispositivo.",
    pushEnabled: "Las notificaciones de la app están conectadas y aparecerán aquí en tiempo real.",
    localInbox: "Bandeja de la app",
    justNow: "Ahora mismo",
    open: "Abrir",
    openSettings: "Gestionar ajustes",
    watchEpisode: "Reanudar episodio",
    lastSynced: "Última sincronización",
    localPush: "Push local",
    syncedInbox: "Bandeja sincronizada",
    testPush: "Enviar push de prueba",
    testPushSending: "Enviando...",
    testPushSuccess: "Push de prueba enviado.",
    testPushMissingDevice: "Todavía no hay ningún dispositivo registrado.",
    testPushUnavailable: "Firebase push no está configurado en el servidor.",
    serverReady: "Servidor listo",
    serverMissing: "Servidor sin configurar",
    devicesLabel: "Dispositivos",
    hoursAgo: (h) => `hace ${h} h`,
    daysAgo: (d) => `hace ${d} d` },
  pt: {
    title: "Notificações",
    markAllRead: "Marcar tudo como lido",
    noNotifications: "Nenhuma notificação ainda",
    watchNow: "Assistir agora",
    connectedDevice: "Dispositivo conectado",
    pushDisabled: "As notificações push estão desativadas neste dispositivo.",
    pushEnabled: "As notificações do app estão conectadas e aparecem aqui em tempo real.",
    localInbox: "Caixa do app",
    justNow: "Agora",
    open: "Abrir",
    openSettings: "Gerenciar ajustes",
    watchEpisode: "Retomar episódio",
    lastSynced: "Última sincronização",
    localPush: "Push local",
    syncedInbox: "Caixa sincronizada",
    testPush: "Enviar push de teste",
    testPushSending: "Enviando...",
    testPushSuccess: "Push de teste enviado.",
    testPushMissingDevice: "Nenhum dispositivo registrado ainda.",
    testPushUnavailable: "O Firebase push não está configurado no servidor.",
    serverReady: "Servidor pronto",
    serverMissing: "Servidor sem configuração",
    devicesLabel: "Dispositivos",
    hoursAgo: (h) => `${h}h atrás`,
    daysAgo: (d) => `${d}d atrás` },
  hi: {
    title: "सूचनाएं",
    markAllRead: "सभी को पढ़ा हुआ करें",
    noNotifications: "अभी कोई सूचना नहीं",
    watchNow: "अभी देखें",
    connectedDevice: "जुड़ा हुआ डिवाइस",
    pushDisabled: "इस डिवाइस पर पुश सूचनाएं बंद हैं।",
    pushEnabled: "ऐप सूचनाएं जुड़ी हुई हैं और यहां तुरंत दिखाई देंगी।",
    localInbox: "ऐप इनबॉक्स",
    justNow: "अभी",
    open: "खोलें",
    openSettings: "सेटिंग्स प्रबंधित करें",
    watchEpisode: "एपिसोड फिर से चलाएं",
    lastSynced: "आखिरी सिंक",
    localPush: "लोकल पुश",
    syncedInbox: "सिंक्ड इनबॉक्स",
    testPush: "टेस्ट पुश भेजें",
    testPushSending: "भेजा जा रहा है...",
    testPushSuccess: "टेस्ट पुश भेज दिया गया।",
    testPushMissingDevice: "अभी कोई रजिस्टर्ड डिवाइस नहीं मिला।",
    testPushUnavailable: "सर्वर पर Firebase push कॉन्फ़िगर नहीं है।",
    serverReady: "सर्वर तैयार",
    serverMissing: "सर्वर कॉन्फ़िगर नहीं है",
    devicesLabel: "डिवाइस",
    hoursAgo: (h) => `${h}घं पहले`,
    daysAgo: (d) => `${d}दिन पहले` },
  id: {
    title: "Notifikasi",
    markAllRead: "Tandai semua sudah dibaca",
    noNotifications: "Belum ada notifikasi",
    watchNow: "Tonton sekarang",
    connectedDevice: "Perangkat terhubung",
    pushDisabled: "Notifikasi push sedang dimatikan di perangkat ini.",
    pushEnabled: "Notifikasi aplikasi sudah terhubung dan akan muncul di sini secara real time.",
    localInbox: "Kotak masuk app",
    justNow: "Baru saja",
    open: "Buka",
    openSettings: "Kelola pengaturan",
    watchEpisode: "Lanjutkan episode",
    lastSynced: "Sinkron terakhir",
    localPush: "Push lokal",
    syncedInbox: "Kotak masuk sinkron",
    testPush: "Kirim push uji",
    testPushSending: "Mengirim...",
    testPushSuccess: "Push uji sudah dikirim.",
    testPushMissingDevice: "Belum ada perangkat yang terdaftar.",
    testPushUnavailable: "Firebase push belum dikonfigurasi di server.",
    serverReady: "Server siap",
    serverMissing: "Server belum dikonfigurasi",
    devicesLabel: "Perangkat",
    hoursAgo: (h) => `${h}j lalu`,
    daysAgo: (d) => `${d}h lalu` } };

export default function NotificationsPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();
  const { loading: authLoading } = useAuthGuard();
  const [notifications, setNotifications] = useState<InAppNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runtimeSettings, setRuntimeSettings] = useState<RuntimeSettingsSnapshot | null>(null);
  const [serverPush, setServerPush] = useState<{
    enabled?: boolean;
    deviceToken?: string;
    platform?: string;
    lastRegisteredAt?: string;
    firebaseConfigured?: boolean;
    deviceCount?: number;
  } | null>(null);
  const [sendingTestPush, setSendingTestPush] = useState(false);

  useEffect(() => {
    if (!token) return;
    userApi.getNotifications(token)
      .then((res: any) => {
        setServerPush(
          res?.data?.push && typeof res.data.push === "object"
            ? {
                enabled: Boolean(res.data.push.enabled),
                deviceToken: typeof res.data.push.deviceToken === "string" ? res.data.push.deviceToken : undefined,
                platform: typeof res.data.push.platform === "string" ? res.data.push.platform : undefined,
                lastRegisteredAt: typeof res.data.push.lastRegisteredAt === "string" ? res.data.push.lastRegisteredAt : undefined,
                firebaseConfigured: typeof res.data.push.firebaseConfigured === "boolean" ? res.data.push.firebaseConfigured : undefined,
                deviceCount: typeof res.data.push.deviceCount === "number" ? res.data.push.deviceCount : undefined,
              }
            : null
        );
        const apiNotifications = Array.isArray(res?.data?.notifications)
          ? res.data.notifications
          : Array.isArray(res?.data)
            ? res.data
            : [];

        setNotifications(mergeInAppNotifications(
          apiNotifications.map((item: any) => ({
            _id: String(item._id),
            type: item.type === "promo" || item.type === "system" ? item.type : "release",
            title: String(item.title || ""),
            message: String(item.message || ""),
            dramaId: typeof item.dramaId === "string" ? item.dramaId : undefined,
            episodeId: typeof item.episodeId === "string" ? item.episodeId : undefined,
            targetPath: typeof item.targetPath === "string"
              ? item.targetPath
              : typeof item.path === "string"
                ? item.path
                : typeof item.href === "string"
                  ? item.href
                  : undefined,
            read: Boolean(item.read),
            createdAt: String(item.createdAt || new Date().toISOString()),
            source: "api" as const,
          }))
        ));
      })
      .catch(() => {
        setServerPush(null);
        setNotifications(readInAppNotifications());
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    setRuntimeSettings(readRuntimeSettings());

    const handleRuntimeSettings = () => {
      setRuntimeSettings(readRuntimeSettings());
    };

    window.addEventListener(RUNTIME_SETTINGS_EVENT, handleRuntimeSettings);
    return () => {
      window.removeEventListener(RUNTIME_SETTINGS_EVENT, handleRuntimeSettings);
    };
  }, []);

  useEffect(() => {
    setNotifications(readInAppNotifications());

    const handleNotificationsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<InAppNotificationItem[]>;
      setNotifications(Array.isArray(customEvent.detail) ? customEvent.detail : readInAppNotifications());
    };

    window.addEventListener(IN_APP_NOTIFICATIONS_EVENT, handleNotificationsUpdate);
    return () => {
      window.removeEventListener(IN_APP_NOTIFICATIONS_EVENT, handleNotificationsUpdate);
    };
  }, []);

  const markRead = async (id: string) => {
    const target = notifications.find((item) => item._id === id);
    if (!target) return;

    try {
      if (target.source === "api" && token) {
        await userApi.markNotificationRead(token, id);
      }
    } finally {
      setNotifications(markInAppNotificationRead(id));
    }
  };

  const markAllRead = async () => {
    try {
      if (token) {
        await userApi.markAllNotificationsRead(token);
      }
    } finally {
      setNotifications(markAllInAppNotificationsRead());
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 pb-16 pt-24">
          <div className="mb-8 space-y-3">
            <div className="h-8 w-40 animate-pulse rounded-full bg-white/8" />
            <div className="h-4 w-64 animate-pulse rounded-full bg-white/6" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                <div className="mb-3 h-4 w-40 animate-pulse rounded-full bg-white/8" />
                <div className="mb-2 h-3 w-3/4 animate-pulse rounded-full bg-white/6" />
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/6" />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pushEnabled = serverPush?.enabled ?? runtimeSettings?.notifications?.push.enabled !== false;
  const connectedDeviceToken = serverPush?.deviceToken || runtimeSettings?.notifications?.push.deviceToken;
  const connectedDevicePlatform = serverPush?.platform || runtimeSettings?.notifications?.push.platform || "mobile";
  const firebaseConfigured = serverPush?.firebaseConfigured ?? false;
  const deviceCount = serverPush?.deviceCount ?? (connectedDeviceToken ? 1 : 0);
  const connectedDevice = connectedDeviceToken
    ? `${connectedDevicePlatform} · ${connectedDeviceToken.slice(-6)}`
    : null;
  const pushRegisteredAt = serverPush?.lastRegisteredAt || runtimeSettings?.notifications?.push.lastRegisteredAt;
  const lastRegisteredAt = pushRegisteredAt
    ? new Date(pushRegisteredAt).toLocaleString(locale)
    : null;

  const handleSendTestPush = async () => {
    if (!token) return;
    if (!connectedDeviceToken) {
      toast(t.testPushMissingDevice, "error");
      return;
    }

    setSendingTestPush(true);
    try {
      const response: any = await settingsApi.sendTestPush(token, {
        path: "/user/notifications",
      });
      const successCount = Number(response?.data?.successCount || 0);
      if (successCount > 0) {
        toast(`${t.testPushSuccess} (${successCount})`, "success");
      } else {
        toast(t.testPushSuccess, "success");
      }
    } catch (error: any) {
      const message = typeof error?.message === "string" ? error.message : "";
      toast(message.includes("Firebase") ? t.testPushUnavailable : message || t.testPushUnavailable, "error");
    } finally {
      setSendingTestPush(false);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "release": return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
      case "promo": return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
      default: return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t.justNow;
    if (hours < 24) return t.hoursAgo(hours);
    const days = Math.floor(hours / 24);
    if (days < 7) return t.daysAgo(days);
    return new Date(dateStr).toLocaleDateString();
  };

  const getNotificationHref = (notification: InAppNotificationItem) => {
    const href = resolveInAppNotificationHref(notification);
    return href ? localizePath(href, locale) : null;
  };

  const getNotificationActionLabel = (notification: InAppNotificationItem) => {
    if (notification.episodeId) return t.watchEpisode;
    if (notification.dramaId) return t.watchNow;
    if (notification.targetPath) return t.open;
    return t.openSettings;
  };

  const handleNotificationPress = async (notification: InAppNotificationItem) => {
    if (!notification.read) {
      await markRead(notification._id);
    }

    const href = getNotificationHref(notification);
    if (href) {
      router.push(href);
      return;
    }

    router.push(localizePath("/user/settings", locale));
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-amber-400 transition hover:text-amber-300"
            >
              {t.markAllRead}
            </button>
          )}
        </div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t.localInbox}</p>
              <p className="mt-2 text-sm text-zinc-300">{pushEnabled ? t.pushEnabled : t.pushDisabled}</p>
              <div className="mt-3 grid gap-2 text-xs text-zinc-500 sm:grid-cols-2">
                <p>{t.connectedDevice}: {connectedDevice || "--"}</p>
                <p>{t.lastSynced}: {lastRegisteredAt || "--"}</p>
                <p>{t.devicesLabel}: {deviceCount}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${pushEnabled ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>
                {pushEnabled ? "Push On" : "Push Off"}
              </div>
              <div className={`rounded-full px-3 py-1 text-[11px] font-semibold ${firebaseConfigured ? "bg-sky-500/15 text-sky-300" : "bg-rose-500/15 text-rose-300"}`}>
                {firebaseConfigured ? t.serverReady : t.serverMissing}
              </div>
              <button
                type="button"
                onClick={() => void handleSendTestPush()}
                disabled={sendingTestPush || !firebaseConfigured}
                className="text-xs font-medium text-sky-400 transition hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingTestPush ? t.testPushSending : t.testPush}
              </button>
              <Link
                href={localizePath("/user/settings", locale)}
                className="text-xs font-medium text-amber-400 transition hover:text-amber-300"
              >
                {t.openSettings}
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800/50" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            <svg className="mx-auto mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p>{t.noNotifications}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => void handleNotificationPress(n)}
                className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition ${
                  n.read
                    ? "border-zinc-800/50 bg-zinc-900/30"
                    : "border-zinc-700/50 bg-zinc-800/50 hover:bg-zinc-800"
                }`}
              >
                {typeIcon(n.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.read ? "text-zinc-400" : "text-white"}`}>
                      {n.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-zinc-500">{formatTime(n.createdAt)}</span>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                    </div>
                  </div>
                  <p className={`mt-1 text-sm ${n.read ? "text-zinc-500" : "text-zinc-300"}`}>
                    {n.message}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      n.source === "local-push"
                        ? "bg-sky-500/15 text-sky-300"
                        : "bg-violet-500/15 text-violet-300"
                    }`}>
                      {n.source === "local-push" ? t.localPush : t.syncedInbox}
                    </span>
                  </div>
                  {getNotificationHref(n) && (
                    <Link
                      href={getNotificationHref(n) || localizePath("/user/settings", locale)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 inline-block text-xs font-medium text-amber-400 hover:text-amber-300"
                    >
                      {getNotificationActionLabel(n)} &rarr;
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
