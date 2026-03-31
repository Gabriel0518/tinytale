"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useRouter} from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { profileApi, settingsApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { localizePath, LOCALE_DISPLAY_NAMES, SupportedLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { mergeRuntimeSettings, readRuntimeSettings } from "@/lib/runtime-settings";
import { usePlatform } from "@/hooks/usePlatform";

type Section = "profile" | "security" | "notifications" | "preferences";

type SettingsCopy = {
  title: string;
  sidebar: {
    profile: string;
    security: string;
    notifications: string;
    preferences: string;
    history: string;
    purchases: string;
    logout: string;
  };
  profile: {
    sectionTitle: string;
    changeAvatar: string;
    username: string;
    usernameNote: string;
    displayName: string;
    displayNamePlaceholder: string;
    email: string;
    verified: string;
    bio: string;
    bioPlaceholder: string;
    cancel: string;
    saveChanges: string;
    saving: string;
    vipMember: string;
  };
  security: {
    passwordTitle: string;
    lastChanged: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    hideCurrent: string;
    showCurrent: string;
    hideNew: string;
    showNew: string;
    updating: string;
    updatePassword: string;
    cancel: string;
    twoFactorTitle: string;
    comingSoon: string;
    twoFactorDesc: string;
    loginActivity: string;
    signOutOthers: string;
    thisDevice: string;
    remove: string;
    connectedAccounts: string;
    google: string;
    facebook: string;
    notConnected: string;
    disconnect: string;
    connect: string;
    dangerZone: string;
    dangerDesc: string;
    deleteAccount: string;
  };
  notifications: {
    pushTitle: string;
    pushDesc: string;
    newReleases: string;
    newReleasesDesc: string;
    recommendations: string;
    recommendationsDesc: string;
    accountActivity: string;
    accountActivityDesc: string;
    emailTitle: string;
    emailDesc: string;
    newsletter: string;
    newsletterDesc: string;
    promoOffers: string;
    promoOffersDesc: string;
    weeklyDigests: string;
    weeklyDigestsDesc: string;
    inAppTitle: string;
    inAppDesc: string;
    systemMessages: string;
    systemMessagesDesc: string;
    systemMessagesFixed: string;
    savePreferences: string;
  };
  preferences: {
    playback: string;
    autoplay: string;
    autoplayDesc: string;
    videoQuality: string;
    qualityAuto: string;
    qualityAutoDesc: string;
    quality1080: string;
    quality1080Desc: string;
    quality720: string;
    quality720Desc: string;
    language: string;
    audioLanguage: string;
    subtitleLanguage: string;
    subtitleOff: string;
    dataStorage: string;
    dataSaver: string;
    dataSaverDesc: string;
    cache: string;
    cacheUsed: string;
    clearCache: string;
    savePreferences: string;
  };
  modal: {
    deleteTitle: string;
    deleteDesc: string;
    cancel: string;
    delete: string;
  };
  sessions: {
    activeNow: string;
    active2h: string;
    active3d: string;
  };
  toasts: {
    profileUpdated: string;
    failedUpdate: string;
    passwordChanged: string;
    failedPassword: string;
    notifSaved: string;
    prefsSaved: string;
    cacheCleared: string;
    generic: string;
  };
};

const COPY: FlexibleRecord<SupportedLocale, SettingsCopy> = {
  en: {
    title: "Account Settings",
    sidebar: {
      profile: "Profile Info",
      security: "Security",
      notifications: "Notifications",
      preferences: "Preferences",
      history: "Watch History",
      purchases: "Purchase History",
      logout: "Sign Out" },
    profile: {
      sectionTitle: "Profile Information",
      changeAvatar: "Change avatar",
      username: "Username",
      usernameNote: "Username cannot be changed",
      displayName: "Display Name",
      displayNamePlaceholder: "Your display name",
      email: "Email",
      verified: "Verified",
      bio: "Bio",
      bioPlaceholder: "Tell us about yourself...",
      cancel: "Cancel",
      saveChanges: "Save Changes",
      saving: "Saving...",
      vipMember: "VIP Member" },
    security: {
      passwordTitle: "Password",
      lastChanged: "Last changed 3 months ago",
      changePassword: "Change Password",
      currentPassword: "Current password",
      newPassword: "New password",
      hideCurrent: "Hide current password",
      showCurrent: "Show current password",
      hideNew: "Hide new password",
      showNew: "Show new password",
      updating: "Updating...",
      updatePassword: "Update Password",
      cancel: "Cancel",
      twoFactorTitle: "Two-Factor Authentication",
      comingSoon: "Coming soon",
      twoFactorDesc: "Add an extra layer of security to your account",
      loginActivity: "Login Activity",
      signOutOthers: "Sign out all other devices",
      thisDevice: "This device",
      remove: "Remove",
      connectedAccounts: "Connected Accounts",
      google: "Google",
      facebook: "Facebook",
      notConnected: "Not connected",
      disconnect: "Disconnect",
      connect: "Connect",
      dangerZone: "Danger Zone",
      dangerDesc: "Permanently delete your account and all associated data",
      deleteAccount: "Delete Account" },
    notifications: {
      pushTitle: "Push Notifications",
      pushDesc: "Manage your mobile and desktop notifications",
      newReleases: "New Releases",
      newReleasesDesc: "Get notified when new episodes are available",
      recommendations: "Recommendations",
      recommendationsDesc: "Personalized drama suggestions based on your taste",
      accountActivity: "Account Activity",
      accountActivityDesc: "Login alerts and security notifications",
      emailTitle: "Email Notifications",
      emailDesc: "Choose what emails you want to receive",
      newsletter: "Newsletter",
      newsletterDesc: "Monthly updates and drama news",
      promoOffers: "Promotional Offers",
      promoOffersDesc: "Special deals and discount codes",
      weeklyDigests: "Weekly Digests",
      weeklyDigestsDesc: "Summary of new content and trending dramas",
      inAppTitle: "In-App Notifications",
      inAppDesc: "Notifications shown within the app",
      systemMessages: "System Messages",
      systemMessagesDesc: "Important system updates and announcements",
      systemMessagesFixed: "System messages cannot be disabled",
      savePreferences: "Save Preferences" },
    preferences: {
      playback: "Playback",
      autoplay: "Autoplay Next Episode",
      autoplayDesc: "Automatically play the next episode when one ends",
      videoQuality: "Video Quality",
      qualityAuto: "Auto",
      qualityAutoDesc: "Best quality for your connection",
      quality1080: "1080p HD",
      quality1080Desc: "High definition streaming",
      quality720: "720p",
      quality720Desc: "Standard definition, saves data",
      language: "Language",
      audioLanguage: "Audio Language",
      subtitleLanguage: "Subtitle Language",
      subtitleOff: "Off",
      dataStorage: "Data & Storage",
      dataSaver: "Data Saver",
      dataSaverDesc: "Reduce data usage when streaming on mobile networks",
      cache: "Cache",
      cacheUsed: "156 MB used",
      clearCache: "Clear Cache",
      savePreferences: "Save Preferences" },
    modal: {
      deleteTitle: "Delete Account?",
      deleteDesc: "This action is permanent and cannot be undone. All your data, watch history, and purchases will be lost.",
      cancel: "Cancel",
      delete: "Delete" },
    sessions: {
      activeNow: "Active Now",
      active2h: "Active 2 hours ago",
      active3d: "Active 3 days ago" },
    toasts: {
      profileUpdated: "Profile updated successfully",
      failedUpdate: "Failed to update",
      passwordChanged: "Password changed successfully",
      failedPassword: "Failed to change password",
      notifSaved: "Notification preferences saved",
      prefsSaved: "Preferences saved",
      cacheCleared: "Cache cleared",
      generic: "An error occurred" } },
  zh: {
    title: "账号设置",
    sidebar: {
      profile: "个人资料",
      security: "安全",
      notifications: "通知",
      preferences: "偏好",
      history: "观看历史",
      purchases: "购买记录",
      logout: "退出登录" },
    profile: {
      sectionTitle: "个人信息",
      changeAvatar: "更换头像",
      username: "用户名",
      usernameNote: "用户名不可修改",
      displayName: "显示名称",
      displayNamePlaceholder: "你的显示名称",
      email: "邮箱",
      verified: "已验证",
      bio: "简介",
      bioPlaceholder: "介绍一下你自己...",
      cancel: "取消",
      saveChanges: "保存更改",
      saving: "保存中...",
      vipMember: "VIP 会员" },
    security: {
      passwordTitle: "密码",
      lastChanged: "上次修改：3个月前",
      changePassword: "修改密码",
      currentPassword: "当前密码",
      newPassword: "新密码",
      hideCurrent: "隐藏当前密码",
      showCurrent: "显示当前密码",
      hideNew: "隐藏新密码",
      showNew: "显示新密码",
      updating: "更新中...",
      updatePassword: "更新密码",
      cancel: "取消",
      twoFactorTitle: "双重验证",
      comingSoon: "即将上线",
      twoFactorDesc: "为你的账号增加额外安全保护",
      loginActivity: "登录活动",
      signOutOthers: "登出其他设备",
      thisDevice: "当前设备",
      remove: "移除",
      connectedAccounts: "已绑定账号",
      google: "Google",
      facebook: "Facebook",
      notConnected: "未绑定",
      disconnect: "解绑",
      connect: "绑定",
      dangerZone: "危险操作",
      dangerDesc: "永久删除账号及所有关联数据",
      deleteAccount: "删除账号" },
    notifications: {
      pushTitle: "推送通知",
      pushDesc: "管理移动端和桌面的通知",
      newReleases: "新剧上线",
      newReleasesDesc: "当新剧集可观看时通知你",
      recommendations: "个性推荐",
      recommendationsDesc: "根据你的喜好推荐短剧",
      accountActivity: "账号活动",
      accountActivityDesc: "登录提醒与安全通知",
      emailTitle: "邮件通知",
      emailDesc: "选择希望接收的邮件类型",
      newsletter: "新闻简报",
      newsletterDesc: "每月更新与短剧资讯",
      promoOffers: "促销优惠",
      promoOffersDesc: "特别活动与优惠码",
      weeklyDigests: "每周摘要",
      weeklyDigestsDesc: "新内容与热门短剧汇总",
      inAppTitle: "应用内通知",
      inAppDesc: "在应用内显示的通知",
      systemMessages: "系统消息",
      systemMessagesDesc: "重要系统更新与公告",
      systemMessagesFixed: "系统消息不可关闭",
      savePreferences: "保存偏好" },
    preferences: {
      playback: "播放",
      autoplay: "自动播放下一集",
      autoplayDesc: "当前一集播放结束后自动播放下一集",
      videoQuality: "视频质量",
      qualityAuto: "自动",
      qualityAutoDesc: "根据网络自动选择最佳画质",
      quality1080: "1080p 高清",
      quality1080Desc: "高画质播放",
      quality720: "720p",
      quality720Desc: "标准画质，节省流量",
      language: "语言",
      audioLanguage: "音频语言",
      subtitleLanguage: "字幕语言",
      subtitleOff: "关闭",
      dataStorage: "数据与存储",
      dataSaver: "省流模式",
      dataSaverDesc: "在移动网络下减少流量消耗",
      cache: "缓存",
      cacheUsed: "已使用 156 MB",
      clearCache: "清除缓存",
      savePreferences: "保存偏好" },
    modal: {
      deleteTitle: "确认删除账号？",
      deleteDesc: "此操作不可恢复。你的所有数据、观看历史和购买记录将被永久删除。",
      cancel: "取消",
      delete: "删除" },
    sessions: {
      activeNow: "当前活跃",
      active2h: "2小时前活跃",
      active3d: "3天前活跃" },
    toasts: {
      profileUpdated: "资料更新成功",
      failedUpdate: "更新失败",
      passwordChanged: "密码修改成功",
      failedPassword: "修改密码失败",
      notifSaved: "通知偏好已保存",
      prefsSaved: "偏好设置已保存",
      cacheCleared: "缓存已清除",
      generic: "发生错误" } },
  ja: {
    title: "アカウント設定",
    sidebar: {
      profile: "プロフィール情報",
      security: "セキュリティ",
      notifications: "通知",
      preferences: "設定",
      history: "視聴履歴",
      purchases: "購入履歴",
      logout: "ログアウト" },
    profile: {
      sectionTitle: "プロフィール情報",
      changeAvatar: "アバターを変更",
      username: "ユーザー名",
      usernameNote: "ユーザー名は変更できません",
      displayName: "表示名",
      displayNamePlaceholder: "表示名を入力",
      email: "メール",
      verified: "認証済み",
      bio: "自己紹介",
      bioPlaceholder: "自己紹介を入力...",
      cancel: "キャンセル",
      saveChanges: "変更を保存",
      saving: "保存中...",
      vipMember: "VIP会員" },
    security: {
      passwordTitle: "パスワード",
      lastChanged: "最終変更: 3か月前",
      changePassword: "パスワード変更",
      currentPassword: "現在のパスワード",
      newPassword: "新しいパスワード",
      hideCurrent: "現在のパスワードを隠す",
      showCurrent: "現在のパスワードを表示",
      hideNew: "新しいパスワードを隠す",
      showNew: "新しいパスワードを表示",
      updating: "更新中...",
      updatePassword: "パスワードを更新",
      cancel: "キャンセル",
      twoFactorTitle: "二段階認証",
      comingSoon: "近日公開",
      twoFactorDesc: "アカウントに追加のセキュリティを設定",
      loginActivity: "ログイン履歴",
      signOutOthers: "他のデバイスをすべてログアウト",
      thisDevice: "このデバイス",
      remove: "削除",
      connectedAccounts: "連携アカウント",
      google: "Google",
      facebook: "Facebook",
      notConnected: "未連携",
      disconnect: "連携解除",
      connect: "連携",
      dangerZone: "危険ゾーン",
      dangerDesc: "アカウントと関連データを完全に削除します",
      deleteAccount: "アカウント削除" },
    notifications: {
      pushTitle: "プッシュ通知",
      pushDesc: "モバイル・デスクトップ通知を管理",
      newReleases: "新着公開",
      newReleasesDesc: "新エピソード公開時に通知",
      recommendations: "おすすめ",
      recommendationsDesc: "好みに合わせたドラマ提案",
      accountActivity: "アカウント活動",
      accountActivityDesc: "ログイン通知とセキュリティ通知",
      emailTitle: "メール通知",
      emailDesc: "受信したいメールを選択",
      newsletter: "ニュースレター",
      newsletterDesc: "毎月の更新とドラマニュース",
      promoOffers: "プロモーション",
      promoOffersDesc: "特別セールと割引コード",
      weeklyDigests: "週間ダイジェスト",
      weeklyDigestsDesc: "新着と人気作品のまとめ",
      inAppTitle: "アプリ内通知",
      inAppDesc: "アプリ内に表示される通知",
      systemMessages: "システムメッセージ",
      systemMessagesDesc: "重要な更新・お知らせ",
      systemMessagesFixed: "システムメッセージは無効化できません",
      savePreferences: "設定を保存" },
    preferences: {
      playback: "再生",
      autoplay: "次のエピソードを自動再生",
      autoplayDesc: "視聴終了後に次話を自動再生",
      videoQuality: "画質",
      qualityAuto: "自動",
      qualityAutoDesc: "接続状況に応じて最適化",
      quality1080: "1080p HD",
      quality1080Desc: "高画質で視聴",
      quality720: "720p",
      quality720Desc: "標準画質・データ節約",
      language: "言語",
      audioLanguage: "音声言語",
      subtitleLanguage: "字幕言語",
      subtitleOff: "オフ",
      dataStorage: "データとストレージ",
      dataSaver: "データ節約",
      dataSaverDesc: "モバイル回線での使用量を削減",
      cache: "キャッシュ",
      cacheUsed: "156 MB 使用中",
      clearCache: "キャッシュを削除",
      savePreferences: "設定を保存" },
    modal: {
      deleteTitle: "アカウントを削除しますか？",
      deleteDesc: "この操作は取り消せません。すべてのデータ、視聴履歴、購入情報が失われます。",
      cancel: "キャンセル",
      delete: "削除" },
    sessions: {
      activeNow: "現在アクティブ",
      active2h: "2時間前にアクティブ",
      active3d: "3日前にアクティブ" },
    toasts: {
      profileUpdated: "プロフィールを更新しました",
      failedUpdate: "更新に失敗しました",
      passwordChanged: "パスワードを変更しました",
      failedPassword: "パスワード変更に失敗しました",
      notifSaved: "通知設定を保存しました",
      prefsSaved: "設定を保存しました",
      cacheCleared: "キャッシュを削除しました",
      generic: "エラーが発生しました" } },
  es: {
    title: "Configuración de cuenta",
    sidebar: {
      profile: "Perfil",
      security: "Seguridad",
      notifications: "Notificaciones",
      preferences: "Preferencias",
      history: "Historial",
      purchases: "Compras",
      logout: "Cerrar sesión" },
    profile: {
      sectionTitle: "Información de perfil",
      changeAvatar: "Cambiar avatar",
      username: "Usuario",
      usernameNote: "El nombre de usuario no se puede cambiar",
      displayName: "Nombre visible",
      displayNamePlaceholder: "Tu nombre visible",
      email: "Correo",
      verified: "Verificado",
      bio: "Bio",
      bioPlaceholder: "Cuéntanos sobre ti...",
      cancel: "Cancelar",
      saveChanges: "Guardar cambios",
      saving: "Guardando...",
      vipMember: "Miembro VIP" },
    security: {
      passwordTitle: "Contraseña",
      lastChanged: "Último cambio hace 3 meses",
      changePassword: "Cambiar contraseña",
      currentPassword: "Contraseña actual",
      newPassword: "Nueva contraseña",
      hideCurrent: "Ocultar contraseña actual",
      showCurrent: "Mostrar contraseña actual",
      hideNew: "Ocultar nueva contraseña",
      showNew: "Mostrar nueva contraseña",
      updating: "Actualizando...",
      updatePassword: "Actualizar contraseña",
      cancel: "Cancelar",
      twoFactorTitle: "Autenticación de dos factores",
      comingSoon: "Próximamente",
      twoFactorDesc: "Agrega una capa extra de seguridad",
      loginActivity: "Actividad de inicio de sesión",
      signOutOthers: "Cerrar sesión en otros dispositivos",
      thisDevice: "Este dispositivo",
      remove: "Quitar",
      connectedAccounts: "Cuentas conectadas",
      google: "Google",
      facebook: "Facebook",
      notConnected: "No conectada",
      disconnect: "Desconectar",
      connect: "Conectar",
      dangerZone: "Zona de peligro",
      dangerDesc: "Elimina tu cuenta y todos los datos asociados",
      deleteAccount: "Eliminar cuenta" },
    notifications: {
      pushTitle: "Notificaciones push",
      pushDesc: "Gestiona notificaciones en móvil y escritorio",
      newReleases: "Nuevos lanzamientos",
      newReleasesDesc: "Recibe aviso cuando haya nuevos episodios",
      recommendations: "Recomendaciones",
      recommendationsDesc: "Sugerencias personalizadas según tus gustos",
      accountActivity: "Actividad de cuenta",
      accountActivityDesc: "Alertas de inicio de sesión y seguridad",
      emailTitle: "Notificaciones por correo",
      emailDesc: "Elige qué correos quieres recibir",
      newsletter: "Boletín",
      newsletterDesc: "Novedades mensuales y noticias",
      promoOffers: "Ofertas promocionales",
      promoOffersDesc: "Ofertas especiales y cupones",
      weeklyDigests: "Resumen semanal",
      weeklyDigestsDesc: "Resumen de contenido nuevo y tendencias",
      inAppTitle: "Notificaciones en la app",
      inAppDesc: "Notificaciones que se muestran en la app",
      systemMessages: "Mensajes del sistema",
      systemMessagesDesc: "Actualizaciones y avisos importantes",
      systemMessagesFixed: "Los mensajes del sistema no se pueden desactivar",
      savePreferences: "Guardar preferencias" },
    preferences: {
      playback: "Reproducción",
      autoplay: "Autorreproducir siguiente episodio",
      autoplayDesc: "Reproduce automáticamente el siguiente episodio",
      videoQuality: "Calidad de video",
      qualityAuto: "Auto",
      qualityAutoDesc: "Mejor calidad según tu conexión",
      quality1080: "1080p HD",
      quality1080Desc: "Alta definición",
      quality720: "720p",
      quality720Desc: "Definición estándar, ahorra datos",
      language: "Idioma",
      audioLanguage: "Idioma de audio",
      subtitleLanguage: "Idioma de subtítulos",
      subtitleOff: "Desactivado",
      dataStorage: "Datos y almacenamiento",
      dataSaver: "Ahorro de datos",
      dataSaverDesc: "Reduce uso de datos en redes móviles",
      cache: "Caché",
      cacheUsed: "156 MB usados",
      clearCache: "Limpiar caché",
      savePreferences: "Guardar preferencias" },
    modal: {
      deleteTitle: "¿Eliminar cuenta?",
      deleteDesc: "Esta acción es permanente. Se perderán tus datos, historial y compras.",
      cancel: "Cancelar",
      delete: "Eliminar" },
    sessions: {
      activeNow: "Activo ahora",
      active2h: "Activo hace 2 horas",
      active3d: "Activo hace 3 días" },
    toasts: {
      profileUpdated: "Perfil actualizado",
      failedUpdate: "No se pudo actualizar",
      passwordChanged: "Contraseña actualizada",
      failedPassword: "No se pudo cambiar la contraseña",
      notifSaved: "Preferencias de notificación guardadas",
      prefsSaved: "Preferencias guardadas",
      cacheCleared: "Caché borrada",
      generic: "Ocurrió un error" } },
  pt: {
    title: "Configurações da conta",
    sidebar: {
      profile: "Perfil",
      security: "Segurança",
      notifications: "Notificações",
      preferences: "Preferências",
      history: "Histórico",
      purchases: "Compras",
      logout: "Sair" },
    profile: {
      sectionTitle: "Informações do perfil",
      changeAvatar: "Alterar avatar",
      username: "Usuário",
      usernameNote: "O nome de usuário não pode ser alterado",
      displayName: "Nome de exibição",
      displayNamePlaceholder: "Seu nome de exibição",
      email: "Email",
      verified: "Verificado",
      bio: "Bio",
      bioPlaceholder: "Conte um pouco sobre você...",
      cancel: "Cancelar",
      saveChanges: "Salvar alterações",
      saving: "Salvando...",
      vipMember: "Membro VIP" },
    security: {
      passwordTitle: "Senha",
      lastChanged: "Alterada há 3 meses",
      changePassword: "Alterar senha",
      currentPassword: "Senha atual",
      newPassword: "Nova senha",
      hideCurrent: "Ocultar senha atual",
      showCurrent: "Mostrar senha atual",
      hideNew: "Ocultar nova senha",
      showNew: "Mostrar nova senha",
      updating: "Atualizando...",
      updatePassword: "Atualizar senha",
      cancel: "Cancelar",
      twoFactorTitle: "Autenticação em dois fatores",
      comingSoon: "Em breve",
      twoFactorDesc: "Adicione uma camada extra de segurança",
      loginActivity: "Atividade de login",
      signOutOthers: "Sair de outros dispositivos",
      thisDevice: "Este dispositivo",
      remove: "Remover",
      connectedAccounts: "Contas conectadas",
      google: "Google",
      facebook: "Facebook",
      notConnected: "Não conectado",
      disconnect: "Desconectar",
      connect: "Conectar",
      dangerZone: "Zona de perigo",
      dangerDesc: "Excluir permanentemente sua conta e dados",
      deleteAccount: "Excluir conta" },
    notifications: {
      pushTitle: "Notificações push",
      pushDesc: "Gerencie notificações no celular e desktop",
      newReleases: "Novos lançamentos",
      newReleasesDesc: "Aviso quando novos episódios forem lançados",
      recommendations: "Recomendações",
      recommendationsDesc: "Sugestões personalizadas para você",
      accountActivity: "Atividade da conta",
      accountActivityDesc: "Alertas de login e segurança",
      emailTitle: "Notificações por e-mail",
      emailDesc: "Escolha quais e-mails deseja receber",
      newsletter: "Newsletter",
      newsletterDesc: "Novidades mensais e notícias",
      promoOffers: "Ofertas promocionais",
      promoOffersDesc: "Ofertas especiais e cupons",
      weeklyDigests: "Resumo semanal",
      weeklyDigestsDesc: "Resumo de novidades e tendências",
      inAppTitle: "Notificações no app",
      inAppDesc: "Notificações exibidas dentro do app",
      systemMessages: "Mensagens do sistema",
      systemMessagesDesc: "Atualizações e avisos importantes",
      systemMessagesFixed: "Mensagens do sistema não podem ser desativadas",
      savePreferences: "Salvar preferências" },
    preferences: {
      playback: "Reprodução",
      autoplay: "Reproduzir próximo episódio automaticamente",
      autoplayDesc: "Reproduz automaticamente o próximo episódio",
      videoQuality: "Qualidade de vídeo",
      qualityAuto: "Automático",
      qualityAutoDesc: "Melhor qualidade para sua conexão",
      quality1080: "1080p HD",
      quality1080Desc: "Alta definição",
      quality720: "720p",
      quality720Desc: "Definição padrão, economiza dados",
      language: "Idioma",
      audioLanguage: "Idioma de áudio",
      subtitleLanguage: "Idioma da legenda",
      subtitleOff: "Desativado",
      dataStorage: "Dados e armazenamento",
      dataSaver: "Economia de dados",
      dataSaverDesc: "Reduz uso de dados em rede móvel",
      cache: "Cache",
      cacheUsed: "156 MB usados",
      clearCache: "Limpar cache",
      savePreferences: "Salvar preferências" },
    modal: {
      deleteTitle: "Excluir conta?",
      deleteDesc: "Esta ação é permanente e não pode ser desfeita.",
      cancel: "Cancelar",
      delete: "Excluir" },
    sessions: {
      activeNow: "Ativo agora",
      active2h: "Ativo há 2 horas",
      active3d: "Ativo há 3 dias" },
    toasts: {
      profileUpdated: "Perfil atualizado com sucesso",
      failedUpdate: "Falha ao atualizar",
      passwordChanged: "Senha alterada com sucesso",
      failedPassword: "Falha ao alterar senha",
      notifSaved: "Preferências de notificação salvas",
      prefsSaved: "Preferências salvas",
      cacheCleared: "Cache limpo",
      generic: "Ocorreu um erro" } },
  hi: {
    title: "अकाउंट सेटिंग्स",
    sidebar: {
      profile: "प्रोफाइल जानकारी",
      security: "सुरक्षा",
      notifications: "सूचनाएं",
      preferences: "पसंद",
      history: "देखने का इतिहास",
      purchases: "खरीद इतिहास",
      logout: "साइन आउट" },
    profile: {
      sectionTitle: "प्रोफाइल जानकारी",
      changeAvatar: "अवतार बदलें",
      username: "यूज़रनेम",
      usernameNote: "यूज़रनेम बदला नहीं जा सकता",
      displayName: "डिस्प्ले नेम",
      displayNamePlaceholder: "आपका डिस्प्ले नेम",
      email: "ईमेल",
      verified: "सत्यापित",
      bio: "बायो",
      bioPlaceholder: "अपने बारे में बताएं...",
      cancel: "रद्द करें",
      saveChanges: "परिवर्तन सहेजें",
      saving: "सहेजा जा रहा है...",
      vipMember: "VIP सदस्य" },
    security: {
      passwordTitle: "पासवर्ड",
      lastChanged: "अंतिम बदलाव 3 महीने पहले",
      changePassword: "पासवर्ड बदलें",
      currentPassword: "वर्तमान पासवर्ड",
      newPassword: "नया पासवर्ड",
      hideCurrent: "वर्तमान पासवर्ड छिपाएं",
      showCurrent: "वर्तमान पासवर्ड दिखाएं",
      hideNew: "नया पासवर्ड छिपाएं",
      showNew: "नया पासवर्ड दिखाएं",
      updating: "अपडेट हो रहा है...",
      updatePassword: "पासवर्ड अपडेट करें",
      cancel: "रद्द करें",
      twoFactorTitle: "टू-फैक्टर प्रमाणीकरण",
      comingSoon: "जल्द आ रहा है",
      twoFactorDesc: "अकाउंट सुरक्षा की एक अतिरिक्त परत जोड़ें",
      loginActivity: "लॉगिन गतिविधि",
      signOutOthers: "अन्य सभी डिवाइस से साइन आउट करें",
      thisDevice: "यह डिवाइस",
      remove: "हटाएं",
      connectedAccounts: "कनेक्टेड अकाउंट्स",
      google: "Google",
      facebook: "Facebook",
      notConnected: "कनेक्ट नहीं",
      disconnect: "डिस्कनेक्ट",
      connect: "कनेक्ट",
      dangerZone: "डेंजर ज़ोन",
      dangerDesc: "अपना अकाउंट और डेटा स्थायी रूप से हटाएं",
      deleteAccount: "अकाउंट हटाएं" },
    notifications: {
      pushTitle: "पुश सूचनाएं",
      pushDesc: "मोबाइल और डेस्कटॉप सूचनाएं प्रबंधित करें",
      newReleases: "नए रिलीज़",
      newReleasesDesc: "नए एपिसोड उपलब्ध होने पर सूचना पाएं",
      recommendations: "सिफारिशें",
      recommendationsDesc: "आपकी पसंद पर आधारित ड्रामा सुझाव",
      accountActivity: "अकाउंट गतिविधि",
      accountActivityDesc: "लॉगिन अलर्ट और सुरक्षा सूचनाएं",
      emailTitle: "ईमेल सूचनाएं",
      emailDesc: "कौन से ईमेल प्राप्त करने हैं चुनें",
      newsletter: "न्यूज़लेटर",
      newsletterDesc: "मासिक अपडेट और ड्रामा समाचार",
      promoOffers: "प्रोमो ऑफर",
      promoOffersDesc: "विशेष ऑफर और डिस्काउंट कोड",
      weeklyDigests: "साप्ताहिक सारांश",
      weeklyDigestsDesc: "नए कंटेंट और ट्रेंडिंग ड्रामा का सारांश",
      inAppTitle: "इन-ऐप सूचनाएं",
      inAppDesc: "ऐप के अंदर दिखाई देने वाली सूचनाएं",
      systemMessages: "सिस्टम संदेश",
      systemMessagesDesc: "महत्वपूर्ण सिस्टम अपडेट और घोषणाएं",
      systemMessagesFixed: "सिस्टम संदेश बंद नहीं किए जा सकते",
      savePreferences: "पसंद सहेजें" },
    preferences: {
      playback: "प्लेबैक",
      autoplay: "अगला एपिसोड ऑटोप्ले",
      autoplayDesc: "एक एपिसोड खत्म होने पर अगला अपने-आप चले",
      videoQuality: "वीडियो गुणवत्ता",
      qualityAuto: "ऑटो",
      qualityAutoDesc: "कनेक्शन के अनुसार सर्वोत्तम गुणवत्ता",
      quality1080: "1080p HD",
      quality1080Desc: "हाई डेफिनिशन स्ट्रीमिंग",
      quality720: "720p",
      quality720Desc: "स्टैंडर्ड डेफिनिशन, डेटा बचत",
      language: "भाषा",
      audioLanguage: "ऑडियो भाषा",
      subtitleLanguage: "सबटाइटल भाषा",
      subtitleOff: "बंद",
      dataStorage: "डेटा और स्टोरेज",
      dataSaver: "डेटा सेवर",
      dataSaverDesc: "मोबाइल नेटवर्क पर डेटा उपयोग कम करें",
      cache: "कैश",
      cacheUsed: "156 MB उपयोग में",
      clearCache: "कैश साफ करें",
      savePreferences: "पसंद सहेजें" },
    modal: {
      deleteTitle: "अकाउंट हटाएं?",
      deleteDesc: "यह क्रिया स्थायी है और वापस नहीं की जा सकती।",
      cancel: "रद्द करें",
      delete: "हटाएं" },
    sessions: {
      activeNow: "अभी सक्रिय",
      active2h: "2 घंटे पहले सक्रिय",
      active3d: "3 दिन पहले सक्रिय" },
    toasts: {
      profileUpdated: "प्रोफाइल सफलतापूर्वक अपडेट हुई",
      failedUpdate: "अपडेट विफल",
      passwordChanged: "पासवर्ड सफलतापूर्वक बदला गया",
      failedPassword: "पासवर्ड बदलना विफल",
      notifSaved: "नोटिफिकेशन सेटिंग्स सहेजी गईं",
      prefsSaved: "पसंद सहेजी गई",
      cacheCleared: "कैश साफ किया गया",
      generic: "एक त्रुटि हुई" } },
  id: {
    title: "Pengaturan akun",
    sidebar: {
      profile: "Info profil",
      security: "Keamanan",
      notifications: "Notifikasi",
      preferences: "Preferensi",
      history: "Riwayat tonton",
      purchases: "Riwayat pembelian",
      logout: "Keluar" },
    profile: {
      sectionTitle: "Informasi profil",
      changeAvatar: "Ganti avatar",
      username: "Username",
      usernameNote: "Username tidak dapat diubah",
      displayName: "Nama tampilan",
      displayNamePlaceholder: "Nama tampilan kamu",
      email: "Email",
      verified: "Terverifikasi",
      bio: "Bio",
      bioPlaceholder: "Ceritakan tentang dirimu...",
      cancel: "Batal",
      saveChanges: "Simpan perubahan",
      saving: "Menyimpan...",
      vipMember: "Anggota VIP" },
    security: {
      passwordTitle: "Kata sandi",
      lastChanged: "Terakhir diubah 3 bulan lalu",
      changePassword: "Ubah kata sandi",
      currentPassword: "Kata sandi saat ini",
      newPassword: "Kata sandi baru",
      hideCurrent: "Sembunyikan kata sandi saat ini",
      showCurrent: "Tampilkan kata sandi saat ini",
      hideNew: "Sembunyikan kata sandi baru",
      showNew: "Tampilkan kata sandi baru",
      updating: "Memperbarui...",
      updatePassword: "Perbarui kata sandi",
      cancel: "Batal",
      twoFactorTitle: "Autentikasi dua faktor",
      comingSoon: "Segera hadir",
      twoFactorDesc: "Tambahkan lapisan keamanan ekstra untuk akun",
      loginActivity: "Aktivitas login",
      signOutOthers: "Keluar dari semua perangkat lain",
      thisDevice: "Perangkat ini",
      remove: "Hapus",
      connectedAccounts: "Akun terhubung",
      google: "Google",
      facebook: "Facebook",
      notConnected: "Belum terhubung",
      disconnect: "Putuskan",
      connect: "Hubungkan",
      dangerZone: "Zona berbahaya",
      dangerDesc: "Hapus akun dan semua data secara permanen",
      deleteAccount: "Hapus akun" },
    notifications: {
      pushTitle: "Notifikasi push",
      pushDesc: "Kelola notifikasi di mobile dan desktop",
      newReleases: "Rilis baru",
      newReleasesDesc: "Dapatkan notifikasi saat episode baru tersedia",
      recommendations: "Rekomendasi",
      recommendationsDesc: "Saran drama personal sesuai selera",
      accountActivity: "Aktivitas akun",
      accountActivityDesc: "Peringatan login dan keamanan",
      emailTitle: "Notifikasi email",
      emailDesc: "Pilih email apa yang ingin diterima",
      newsletter: "Newsletter",
      newsletterDesc: "Update bulanan dan berita drama",
      promoOffers: "Penawaran promo",
      promoOffersDesc: "Promo spesial dan kode diskon",
      weeklyDigests: "Ringkasan mingguan",
      weeklyDigestsDesc: "Ringkasan konten baru dan drama trending",
      inAppTitle: "Notifikasi dalam aplikasi",
      inAppDesc: "Notifikasi yang tampil di dalam aplikasi",
      systemMessages: "Pesan sistem",
      systemMessagesDesc: "Update dan pengumuman penting",
      systemMessagesFixed: "Pesan sistem tidak bisa dinonaktifkan",
      savePreferences: "Simpan preferensi" },
    preferences: {
      playback: "Pemutaran",
      autoplay: "Putar otomatis episode berikutnya",
      autoplayDesc: "Otomatis putar episode berikutnya saat selesai",
      videoQuality: "Kualitas video",
      qualityAuto: "Otomatis",
      qualityAutoDesc: "Kualitas terbaik sesuai koneksi",
      quality1080: "1080p HD",
      quality1080Desc: "Streaming definisi tinggi",
      quality720: "720p",
      quality720Desc: "Definisi standar, hemat data",
      language: "Bahasa",
      audioLanguage: "Bahasa audio",
      subtitleLanguage: "Bahasa subtitle",
      subtitleOff: "Nonaktif",
      dataStorage: "Data & penyimpanan",
      dataSaver: "Penghemat data",
      dataSaverDesc: "Kurangi penggunaan data di jaringan seluler",
      cache: "Cache",
      cacheUsed: "156 MB digunakan",
      clearCache: "Bersihkan cache",
      savePreferences: "Simpan preferensi" },
    modal: {
      deleteTitle: "Hapus akun?",
      deleteDesc: "Aksi ini permanen dan tidak bisa dibatalkan.",
      cancel: "Batal",
      delete: "Hapus" },
    sessions: {
      activeNow: "Aktif sekarang",
      active2h: "Aktif 2 jam lalu",
      active3d: "Aktif 3 hari lalu" },
    toasts: {
      profileUpdated: "Profil berhasil diperbarui",
      failedUpdate: "Gagal memperbarui",
      passwordChanged: "Kata sandi berhasil diubah",
      failedPassword: "Gagal mengubah kata sandi",
      notifSaved: "Preferensi notifikasi disimpan",
      prefsSaved: "Preferensi disimpan",
      cacheCleared: "Cache dibersihkan",
      generic: "Terjadi kesalahan" } } };

type NotificationSettingsState = {
  push: {
    enabled: boolean;
    newReleases: boolean;
    recommendations: boolean;
    accountActivity: boolean;
    deviceToken?: string;
    platform?: string;
    lastRegisteredAt?: string;
  };
  email: {
    newsletter: boolean;
    promoOffers: boolean;
    weeklyDigests: boolean;
  };
  inApp: {
    systemMessages: boolean;
  };
};

type PlaybackSettingsState = {
  autoplayNextEpisode: boolean;
  videoQuality: string;
  audioLanguage: string;
  subtitleLanguage: string;
  dataSaver: boolean;
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsState = {
  push: {
    enabled: true,
    newReleases: true,
    recommendations: true,
    accountActivity: true,
  },
  email: {
    newsletter: false,
    promoOffers: true,
    weeklyDigests: false,
  },
  inApp: {
    systemMessages: true,
  },
};

const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettingsState = {
  autoplayNextEpisode: true,
  videoQuality: "auto",
  audioLanguage: "en",
  subtitleLanguage: "en",
  dataSaver: false,
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${checked ? "bg-red-600" : "bg-gray-700"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const locale = useLocale();
  const copy = resolveLocaleCopy(COPY, locale);
  const { isMobile } = usePlatform();
  const languageOptions = useMemo(() => {
    const labels = new Intl.DisplayNames([locale], { type: "language" });
    return SUPPORTED_LOCALES.map((code) => ({
      value: code,
      label: labels.of(code) || LOCALE_DISPLAY_NAMES[code] }));
  }, [locale]);

  const { user, token, logout, updateUser } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const router = useRouter();
  const [section, setSection] = useState<Section>("profile");
  const [mobileView, setMobileView] = useState<"menu" | "detail">("menu");

  const sidebarItems: { id: Section | "history" | "purchases" | "logout"; label: string; icon: string }[] = [
    { id: "profile", label: copy.sidebar.profile, icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
    { id: "security", label: copy.sidebar.security, icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
    { id: "notifications", label: copy.sidebar.notifications, icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
    { id: "preferences", label: copy.sidebar.preferences, icon: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" },
    { id: "history", label: copy.sidebar.history, icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "purchases", label: copy.sidebar.purchases, icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
    { id: "logout", label: copy.sidebar.logout, icon: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" },
  ];

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessions, setSessions] = useState([
    { id: "sess_1", device: "Macbook Pro 16\"", location: "San Francisco, USA", browser: "Chrome", ip: "192.168.1.1", isCurrent: true, lastActive: copy.sessions.activeNow },
    { id: "sess_2", device: "iPhone 14 Pro", location: "Los Angeles, USA", browser: "App", ip: "10.0.0.1", isCurrent: false, lastActive: copy.sessions.active2h },
    { id: "sess_3", device: "iPad Air", location: "New York, USA", browser: "Safari", ip: "172.16.0.1", isCurrent: false, lastActive: copy.sessions.active3d },
  ]);
  const [googleConnected] = useState("jane.c***@example.com");
  const [fbConnected] = useState("");

  const [notifs, setNotifs] = useState<NotificationSettingsState>(DEFAULT_NOTIFICATION_SETTINGS);

  const [autoplay, setAutoplay] = useState(DEFAULT_PLAYBACK_SETTINGS.autoplayNextEpisode);
  const [videoQuality, setVideoQuality] = useState(DEFAULT_PLAYBACK_SETTINGS.videoQuality);
  const [audioLang, setAudioLang] = useState(DEFAULT_PLAYBACK_SETTINGS.audioLanguage);
  const [subtitleLang, setSubtitleLang] = useState(DEFAULT_PLAYBACK_SETTINGS.subtitleLanguage);
  const [dataSaver, setDataSaver] = useState(DEFAULT_PLAYBACK_SETTINGS.dataSaver);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) setNickname(user.nickname || "");
  }, [user]);

  useEffect(() => {
    if (!token || !user) return;

    let cancelled = false;

    const hydrateSettings = async () => {
      const runtimeSettings = readRuntimeSettings();

      try {
        const response: any = await settingsApi.getSettings(token);
        const settings = response?.data || {};
        const notificationSettings = settings.notifications || runtimeSettings?.notifications || {};
        const playbackSettings = settings.playback || runtimeSettings?.playback || {};

        if (cancelled) return;

        const nextNotifications: NotificationSettingsState = {
          push: {
            enabled: Boolean(notificationSettings?.push?.enabled ?? runtimeSettings?.notifications?.push?.enabled ?? true),
            newReleases: Boolean(notificationSettings?.push?.newReleases ?? runtimeSettings?.notifications?.push?.newReleases ?? true),
            recommendations: Boolean(notificationSettings?.push?.recommendations ?? runtimeSettings?.notifications?.push?.recommendations ?? true),
            accountActivity: Boolean(notificationSettings?.push?.accountActivity ?? runtimeSettings?.notifications?.push?.accountActivity ?? true),
            deviceToken: notificationSettings?.push?.deviceToken ?? runtimeSettings?.notifications?.push?.deviceToken,
            platform: notificationSettings?.push?.platform ?? runtimeSettings?.notifications?.push?.platform,
            lastRegisteredAt: notificationSettings?.push?.lastRegisteredAt ?? runtimeSettings?.notifications?.push?.lastRegisteredAt,
          },
          email: {
            newsletter: Boolean(notificationSettings?.email?.newsletter ?? runtimeSettings?.notifications?.email?.newsletter ?? false),
            promoOffers: Boolean(notificationSettings?.email?.promoOffers ?? runtimeSettings?.notifications?.email?.promoOffers ?? true),
            weeklyDigests: Boolean(notificationSettings?.email?.weeklyDigests ?? runtimeSettings?.notifications?.email?.weeklyDigests ?? false),
          },
          inApp: {
            systemMessages: Boolean(notificationSettings?.inApp?.systemMessages ?? runtimeSettings?.notifications?.inApp?.systemMessages ?? true),
          },
        };

        const nextPlayback: PlaybackSettingsState = {
          autoplayNextEpisode: Boolean(playbackSettings?.autoplayNextEpisode ?? runtimeSettings?.playback?.autoplayNextEpisode ?? true),
          videoQuality: String(playbackSettings?.videoQuality ?? runtimeSettings?.playback?.videoQuality ?? "auto"),
          audioLanguage: String(playbackSettings?.audioLanguage ?? runtimeSettings?.playback?.audioLanguage ?? settings.language ?? locale),
          subtitleLanguage: String(playbackSettings?.subtitleLanguage ?? runtimeSettings?.playback?.subtitleLanguage ?? settings.language ?? locale),
          dataSaver: Boolean(playbackSettings?.dataSaver ?? runtimeSettings?.playback?.dataSaver ?? false),
        };

        setNotifs(nextNotifications);
        setAutoplay(nextPlayback.autoplayNextEpisode);
        setVideoQuality(nextPlayback.videoQuality);
        setAudioLang(nextPlayback.audioLanguage);
        setSubtitleLang(nextPlayback.subtitleLanguage);
        setDataSaver(nextPlayback.dataSaver);

        mergeRuntimeSettings({
          notifications: nextNotifications,
          playback: nextPlayback,
        });
      } catch {
        if (cancelled || !runtimeSettings) return;

        if (runtimeSettings.notifications) {
          setNotifs(runtimeSettings.notifications);
        }

        if (runtimeSettings.playback) {
          setAutoplay(runtimeSettings.playback.autoplayNextEpisode);
          setVideoQuality(runtimeSettings.playback.videoQuality);
          setAudioLang(runtimeSettings.playback.audioLanguage);
          setSubtitleLang(runtimeSettings.playback.subtitleLanguage);
          setDataSaver(runtimeSettings.playback.dataSaver);
        }
      }
    };

    void hydrateSettings();

    return () => {
      cancelled = true;
    };
  }, [locale, token, user]);

  useEffect(() => {
    setSessions((prev) => prev.map((session) => {
      if (session.id === "sess_1") return { ...session, lastActive: copy.sessions.activeNow };
      if (session.id === "sess_2") return { ...session, lastActive: copy.sessions.active2h };
      if (session.id === "sess_3") return { ...session, lastActive: copy.sessions.active3d };
      return session;
    }));
  }, [copy.sessions.activeNow, copy.sessions.active2h, copy.sessions.active3d]);

  useEffect(() => {
    if (!isMobile) {
      setMobileView("detail");
      return;
    }
    setMobileView("menu");
  }, [isMobile]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await profileApi.update(token, { nickname });
      updateUser({ ...user, nickname });
      toast(copy.toasts.profileUpdated, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.toasts.generic;
      toast(message || copy.toasts.failedUpdate, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await profileApi.changePassword(token, oldPassword, newPassword);
      toast(copy.toasts.passwordChanged, "success");
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.toasts.generic;
      toast(message || copy.toasts.failedPassword, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!token) return;

    setNotificationsSaving(true);
    try {
      const nextNotifications: NotificationSettingsState = {
        ...notifs,
        push: {
          ...notifs.push,
          deviceToken: notifs.push.deviceToken ?? readRuntimeSettings()?.notifications?.push?.deviceToken,
          platform: notifs.push.platform ?? readRuntimeSettings()?.notifications?.push?.platform,
          lastRegisteredAt: notifs.push.lastRegisteredAt ?? readRuntimeSettings()?.notifications?.push?.lastRegisteredAt,
        },
      };

      await settingsApi.updateSettings(token, {
        notifications: nextNotifications,
      });

      setNotifs(nextNotifications);
      mergeRuntimeSettings({ notifications: nextNotifications });
      toast(copy.toasts.notifSaved, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.toasts.generic;
      toast(message, "error");
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!token) return;

    setPreferencesSaving(true);
    try {
      const nextPlayback: PlaybackSettingsState = {
        autoplayNextEpisode: autoplay,
        videoQuality,
        audioLanguage: audioLang,
        subtitleLanguage: subtitleLang,
        dataSaver,
      };

      await settingsApi.updateSettings(token, {
        playback: nextPlayback,
      });

      mergeRuntimeSettings({ playback: nextPlayback });
      toast(copy.toasts.prefsSaved, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.toasts.generic;
      toast(message, "error");
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleSidebar = (id: string) => {
    if (id === "logout") { logout(); router.push(localizePath("/", locale)); return; }
    if (id === "history") { router.push(localizePath("/user/history", locale)); return; }
    if (id === "purchases") { router.push(localizePath("/user/purchases", locale)); return; }
    setSection(id as Section);
  };

  const isVip = user.vipStatus === "active";
  const sectionTitleMap: Record<Section, string> = {
    profile: copy.sidebar.profile,
    security: copy.sidebar.security,
    notifications: copy.sidebar.notifications,
    preferences: copy.sidebar.preferences,
  };
  const mobileLegalLinks = [
    { label: "Help Center", href: localizePath("/help", locale) },
    { label: "Terms of Service", href: localizePath("/terms", locale) },
    { label: "Privacy Policy", href: localizePath("/privacy", locale) },
  ];

  const openMobileSection = (next: Section) => {
    setSection(next);
    setMobileView("detail");
  };

  const handleMobileMenuAction = (id: Section | "history" | "purchases" | "logout") => {
    if (id === "logout") {
      logout();
      router.push(localizePath("/", locale));
      return;
    }
    if (id === "history") {
      router.push(localizePath("/user/history", locale));
      return;
    }
    if (id === "purchases") {
      router.push(localizePath("/user/purchases", locale));
      return;
    }
    openMobileSection(id);
  };

  return (
    <div className="keyboard-safe-form min-h-screen bg-black text-white">
      <Navbar />

      <div className="keyboard-safe-form max-w-6xl mx-auto px-4 pt-24 pb-16">
        <h1 className={`font-bold ${isMobile ? "mb-4 text-xl" : "mb-8 text-2xl"}`}>{copy.title}</h1>
        <div className="md:flex gap-8">
          <aside className="w-56 shrink-0 hidden md:block">
            <div className="bg-zinc-900/60 rounded-xl border border-white/10 overflow-hidden">
              {sidebarItems.map((item, i) => {
                const isActive = item.id === section && !["history", "purchases", "logout"].includes(item.id);
                const isLogout = item.id === "logout";
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSidebar(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-2 ${
                      isActive ? "border-red-500 bg-red-500/10 text-white" : "border-transparent hover:bg-white/5 text-gray-400 hover:text-white"
                    } ${isLogout ? "text-red-400 hover:text-red-300" : ""} ${i > 0 ? "border-t border-white/5" : ""}`}
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {isMobile ? (
            mobileView === "menu" ? (
              <div className="mb-4 w-full space-y-4">
                <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
                  <p className="px-4 pt-4 text-[11px] uppercase tracking-[0.16em] text-white/35">Account</p>
                  {([
                    { id: "profile", label: copy.sidebar.profile },
                    { id: "security", label: copy.sidebar.security },
                    { id: "history", label: copy.sidebar.history },
                    { id: "purchases", label: copy.sidebar.purchases },
                  ] as const).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMobileMenuAction(item.id)}
                      className="flex w-full items-center justify-between border-t border-white/5 px-4 py-3 text-left text-sm text-white"
                    >
                      <span>{item.label}</span>
                      <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
                  <p className="px-4 pt-4 text-[11px] uppercase tracking-[0.16em] text-white/35">Preferences</p>
                  {([
                    { id: "notifications", label: copy.sidebar.notifications },
                    { id: "preferences", label: copy.sidebar.preferences },
                  ] as const).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMobileMenuAction(item.id)}
                      className="flex w-full items-center justify-between border-t border-white/5 px-4 py-3 text-left text-sm text-white"
                    >
                      <span>{item.label}</span>
                      <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
                  <p className="px-4 pt-4 text-[11px] uppercase tracking-[0.16em] text-white/35">About</p>
                  {mobileLegalLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-sm text-white"
                    >
                      <span>{item.label}</span>
                      <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </section>

                <button
                  type="button"
                  onClick={() => handleMobileMenuAction("logout")}
                  className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300"
                >
                  {copy.sidebar.logout}
                </button>
              </div>
            ) : (
              <div className="mb-4 flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setMobileView("menu")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
                  aria-label="Back to settings menu"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-white/45">Settings</p>
                  <p className="text-sm font-semibold text-white">{sectionTitleMap[section]}</p>
                </div>
              </div>
            )
          ) : null}

          <main className={`flex-1 min-w-0 ${isMobile && mobileView === "menu" ? "hidden" : ""}`}>
            {section === "profile" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-6">{copy.profile.sectionTitle}</h2>
                  <div className="flex items-center gap-5 mb-8">
                    <div className="relative group">
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-2xl font-bold ${isVip ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-900" : ""}`}>
                        {user.nickname?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <button className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center" aria-label={copy.profile.changeAvatar}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                      </button>
                    </div>
                    <div>
                      <p className="font-medium">{user.nickname}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      {isVip && <span className="inline-flex items-center gap-1 mt-1 text-xs text-yellow-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>{copy.profile.vipMember}</span>}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="settings-username" className="block text-sm text-gray-400 mb-1.5">{copy.profile.username}</label>
                      <input id="settings-username" type="text" value={user.email?.split("@")[0] || ""} disabled className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                      <p className="text-xs text-gray-500 mt-1">{copy.profile.usernameNote}</p>
                    </div>
                    <div>
                      <label htmlFor="settings-displayname" className="block text-sm text-gray-400 mb-1.5">{copy.profile.displayName}</label>
                      <input id="settings-displayname" type="text" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={30} className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none transition" placeholder={copy.profile.displayNamePlaceholder} />
                    </div>
                    <div>
                      <label htmlFor="settings-email" className="block text-sm text-gray-400 mb-1.5">{copy.profile.email}</label>
                      <div className="flex items-center gap-3">
                        <input id="settings-email" type="email" value={user.email || ""} disabled className="flex-1 bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                        <span className="flex items-center gap-1 text-xs text-green-400"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{copy.profile.verified}</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="settings-bio" className="block text-sm text-gray-400 mb-1.5">{copy.profile.bio}</label>
                      <textarea id="settings-bio" value={bio} onChange={e => setBio(e.target.value)} maxLength={200} rows={3} className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none transition resize-none" placeholder={copy.profile.bioPlaceholder} />
                      <p className="text-xs text-gray-500 text-right">{bio.length}/200</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                    <button onClick={() => { setNickname(user.nickname || ""); setBio(""); }} className="px-5 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition">{copy.profile.cancel}</button>
                    <button onClick={handleSaveProfile} disabled={saving} className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition disabled:opacity-50">{saving ? copy.profile.saving : copy.profile.saveChanges}</button>
                  </div>
                </div>
              </div>
            )}

            {section === "security" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-1">{copy.security.passwordTitle}</h2>
                  <p className="text-sm text-gray-400 mb-4">{copy.security.lastChanged}</p>
                  {!showPasswordForm ? (
                    <button onClick={() => setShowPasswordForm(true)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-sm transition">{copy.security.changePassword}</button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      <div className="relative">
                        <input id="settings-current-password" type={showOld ? "text" : "password"} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder={copy.security.currentPassword} required className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none pr-10" aria-label={copy.security.currentPassword} />
                        <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label={showOld ? copy.security.hideCurrent : copy.security.showCurrent}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={showOld ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"} />{!showOld && <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}</svg>
                        </button>
                      </div>

                      <div className="relative">
                        <input id="settings-new-password" type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={copy.security.newPassword} required minLength={8} className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none pr-10" aria-label={copy.security.newPassword} />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label={showNew ? copy.security.hideNew : copy.security.showNew}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={showNew ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"} />{!showNew && <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}</svg>
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition disabled:opacity-50">{saving ? copy.security.updating : copy.security.updatePassword}</button>
                        <button type="button" onClick={() => { setShowPasswordForm(false); setOldPassword(""); setNewPassword(""); }} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">{copy.security.cancel}</button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{copy.security.twoFactorTitle}</h2>
                        <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full font-medium">{copy.security.comingSoon}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{copy.security.twoFactorDesc}</p>
                    </div>
                    <Toggle checked={twoFactor} onChange={setTwoFactor} disabled />
                  </div>
                </div>

                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{copy.security.loginActivity}</h2>
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full font-medium">{copy.security.comingSoon}</span>
                    </div>
                    <button onClick={() => setSessions(s => s.filter(x => x.isCurrent))} className="text-sm text-red-400 hover:text-red-300 transition">{copy.security.signOutOthers}</button>
                  </div>
                  <div className="space-y-3">
                    {sessions.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={s.device.includes("iPhone") ? "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" : s.device.includes("iPad") ? "M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" : "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"} /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{s.device} · {s.browser}</p>
                            <p className="text-xs text-gray-400">{s.location} · {s.lastActive}</p>
                          </div>
                        </div>
                        {s.isCurrent ? (
                          <span className="text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">{copy.security.thisDevice}</span>
                        ) : (
                          <button onClick={() => setSessions(prev => prev.filter(x => x.id !== s.id))} className="text-sm text-red-400 hover:text-red-300 transition">{copy.security.remove}</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{copy.security.connectedAccounts}</h2>
                    <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full font-medium">{copy.security.comingSoon}</span>
                  </div>
                  <div className="space-y-3 opacity-60 pointer-events-none">
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg></div>
                        <div>
                          <p className="text-sm font-medium">{copy.security.google}</p>
                          <p className="text-xs text-gray-400">{googleConnected || copy.security.notConnected}</p>
                        </div>
                      </div>
                      <button className={`text-sm px-3 py-1.5 rounded-lg transition ${googleConnected ? "text-red-400 hover:text-red-300" : "bg-white/10 hover:bg-white/20 text-white"}`}>{googleConnected ? copy.security.disconnect : copy.security.connect}</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1877F2]/20 flex items-center justify-center"><svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>
                        <div>
                          <p className="text-sm font-medium">{copy.security.facebook}</p>
                          <p className="text-xs text-gray-400">{fbConnected || copy.security.notConnected}</p>
                        </div>
                      </div>
                      <button className={`text-sm px-3 py-1.5 rounded-lg transition ${fbConnected ? "text-red-400 hover:text-red-300" : "bg-white/10 hover:bg-white/20 text-white"}`}>{fbConnected ? copy.security.disconnect : copy.security.connect}</button>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/60 rounded-xl border border-red-500/20 p-6">
                  <h2 className="text-lg font-semibold text-red-400 mb-1">{copy.security.dangerZone}</h2>
                  <p className="text-sm text-gray-400 mb-4">{copy.security.dangerDesc}</p>
                  <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-sm font-medium transition">{copy.security.deleteAccount}</button>
                </div>
              </div>
            )}

            {section === "notifications" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold mb-1">{copy.notifications.pushTitle}</h2>
                      <p className="text-sm text-gray-400">{copy.notifications.pushDesc}</p>
                    </div>
                    <Toggle
                      checked={notifs.push.enabled}
                      onChange={(value) => setNotifs((prev) => ({ ...prev, push: { ...prev.push, enabled: value } }))}
                    />
                  </div>
                  <div className={`space-y-4 transition ${notifs.push.enabled ? "opacity-100" : "opacity-45"}`}>
                    {([
                      ["newReleases", copy.notifications.newReleases, copy.notifications.newReleasesDesc],
                      ["recommendations", copy.notifications.recommendations, copy.notifications.recommendationsDesc],
                      ["accountActivity", copy.notifications.accountActivity, copy.notifications.accountActivityDesc],
                    ] as const).map(([key, label, desc]) => (
                      <div key={key} className="flex items-center justify-between py-2">
                        <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
                        <Toggle
                          checked={notifs.push[key]}
                          disabled={!notifs.push.enabled}
                          onChange={v => setNotifs(prev => ({ ...prev, push: { ...prev.push, [key]: v } }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-1">{copy.notifications.emailTitle}</h2>
                  <p className="text-sm text-gray-400 mb-5">{copy.notifications.emailDesc}</p>
                  <div className="space-y-4">
                    {([
                      ["newsletter", copy.notifications.newsletter, copy.notifications.newsletterDesc],
                      ["promoOffers", copy.notifications.promoOffers, copy.notifications.promoOffersDesc],
                      ["weeklyDigests", copy.notifications.weeklyDigests, copy.notifications.weeklyDigestsDesc],
                    ] as const).map(([key, label, desc]) => (
                      <div key={key} className="flex items-center justify-between py-2">
                        <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
                        <Toggle checked={notifs.email[key]} onChange={v => setNotifs(prev => ({ ...prev, email: { ...prev.email, [key]: v } }))} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-1">{copy.notifications.inAppTitle}</h2>
                  <p className="text-sm text-gray-400 mb-5">{copy.notifications.inAppDesc}</p>
                  <div className="flex items-center justify-between py-2">
                    <div><p className="text-sm font-medium">{copy.notifications.systemMessages}</p><p className="text-xs text-gray-400">{copy.notifications.systemMessagesDesc}</p></div>
                    <Toggle checked={notifs.inApp.systemMessages} onChange={() => {}} disabled />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{copy.notifications.systemMessagesFixed}</p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={notificationsSaving}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {copy.notifications.savePreferences}
                  </button>
                </div>
              </div>
            )}

            {section === "preferences" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-5">{copy.preferences.playback}</h2>
                  <div className="flex items-center justify-between mb-6">
                    <div><p className="text-sm font-medium">{copy.preferences.autoplay}</p><p className="text-xs text-gray-400">{copy.preferences.autoplayDesc}</p></div>
                    <Toggle checked={autoplay} onChange={setAutoplay} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">{copy.preferences.videoQuality}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[["auto", copy.preferences.qualityAuto, copy.preferences.qualityAutoDesc], ["1080p", copy.preferences.quality1080, copy.preferences.quality1080Desc], ["720p", copy.preferences.quality720, copy.preferences.quality720Desc]].map(([val, label, desc]) => (
                        <button key={val} onClick={() => setVideoQuality(val)} className={`p-4 rounded-xl border text-left transition ${videoQuality === val ? "border-red-500 bg-red-500/10" : "border-white/10 bg-zinc-800/50 hover:border-white/20"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{label}</p>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${videoQuality === val ? "border-red-500" : "border-gray-600"}`}>
                              {videoQuality === val && <div className="w-2 h-2 rounded-full bg-red-500" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-5">{copy.preferences.language}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="settings-audio-lang" className="block text-sm text-gray-400 mb-1.5">{copy.preferences.audioLanguage}</label>
                      <select id="settings-audio-lang" value={audioLang} onChange={e => setAudioLang(e.target.value)} className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none appearance-none cursor-pointer">
                        {languageOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="settings-subtitle-lang" className="block text-sm text-gray-400 mb-1.5">{copy.preferences.subtitleLanguage}</label>
                      <select id="settings-subtitle-lang" value={subtitleLang} onChange={e => setSubtitleLang(e.target.value)} className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none appearance-none cursor-pointer">
                        {languageOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                        <option value="off">{copy.preferences.subtitleOff}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/60 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold mb-5">{copy.preferences.dataStorage}</h2>
                  <div className="flex items-center justify-between mb-4">
                    <div><p className="text-sm font-medium">{copy.preferences.dataSaver}</p><p className="text-xs text-gray-400">{copy.preferences.dataSaverDesc}</p></div>
                    <Toggle checked={dataSaver} onChange={setDataSaver} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                    <div><p className="text-sm font-medium">{copy.preferences.cache}</p><p className="text-xs text-gray-400">{copy.preferences.cacheUsed}</p></div>
                    <button onClick={() => toast(copy.toasts.cacheCleared, "success")} className="text-sm text-red-400 hover:text-red-300 transition">{copy.preferences.clearCache}</button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    disabled={preferencesSaving}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {copy.preferences.savePreferences}
                  </button>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">{copy.modal.deleteTitle}</h3>
            <p className="text-sm text-gray-400 text-center mb-6">{copy.modal.deleteDesc}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition">{copy.modal.cancel}</button>
              <button onClick={async () => { try { await profileApi.deleteAccount(token!); logout(); router.push(localizePath("/", locale)); } catch {} }} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition">{copy.modal.delete}</button>
            </div>
          </div>
        </div>
      )}

      {!isMobile ? <Footer /> : null}
    </div>
  );
}
