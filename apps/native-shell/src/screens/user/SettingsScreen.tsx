import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData } from '../../lib/api-response';
import { normalizeUserSettings } from '../../lib/user-normalizers';
import { useNativeAuth } from '../../providers/AuthProvider';

const USER_CACHE_MAX_AGE_MS = 2 * 60 * 1000;
const DEFAULT_PUSH_TEST_ROUTE = '/user/notifications';
const DEFAULT_PUSH_TEST_URL = 'https://tinytale.top/about';

export function SettingsScreen() {
  const api = useShellApi();
  const { user, token, updateUser } = useNativeAuth();
  const { isOffline } = useNetworkStatus();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [language, setLanguage] = useState('en');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [marketingEmail, setMarketingEmail] = useState(true);
  const [autoplayNextEpisode, setAutoplayNextEpisode] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [videoQuality, setVideoQuality] = useState('auto');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [pushTestMode, setPushTestMode] = useState<'route' | 'url'>('route');
  const [pushTestTarget, setPushTestTarget] = useState(DEFAULT_PUSH_TEST_ROUTE);
  const [pushTestTitle, setPushTestTitle] = useState('TinyTale Native Test');
  const [pushTestBody, setPushTestBody] = useState('Open this notification to verify real-device routing.');

  const settingsQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:settings`,
    cacheMaxAgeMs: USER_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'settings'],
    queryFn: () => api.settings.getSettings(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const settingsPayload =
    unwrapApiData<Record<string, unknown>>(
      settingsQuery.data as Record<string, unknown> | { success: boolean; data?: Record<string, unknown> } | undefined
    ) ?? {};
  const normalizedSettings = normalizeUserSettings(settingsPayload);
  const notificationsConfig =
    settingsPayload.notifications && typeof settingsPayload.notifications === 'object'
      ? (settingsPayload.notifications as Record<string, unknown>)
      : {};
  const pushConfig =
    notificationsConfig.push && typeof notificationsConfig.push === 'object'
      ? (notificationsConfig.push as Record<string, unknown>)
      : {};
  const pushDeviceToken = typeof pushConfig.deviceToken === 'string' ? pushConfig.deviceToken : '';
  const pushPlatform = typeof pushConfig.platform === 'string' ? pushConfig.platform : '';
  const pushLastRegisteredAt = typeof pushConfig.lastRegisteredAt === 'string' ? pushConfig.lastRegisteredAt : '';
  const isNativePlatform = Capacitor.isNativePlatform();
  const pushSyncStatus = !pushEnabled
    ? 'Push notifications are turned off for this account.'
    : !isNativePlatform
      ? 'Push registration activates on the Android build. Web preview only stores the preference.'
      : pushDeviceToken
        ? 'Push notifications are registered on this device.'
        : isOffline
          ? 'Push preference is saved locally. Device registration will retry when the network returns.'
          : 'Push preference is enabled. Waiting for permission approval or device token sync.';

  useEffect(() => {
    setNickname(user?.nickname || '');
    setLanguage(normalizedSettings.language);
    setPushEnabled(normalizedSettings.notifications.pushEnabled);
    setMarketingEmail(normalizedSettings.notifications.marketingEmail);
    setAutoplayNextEpisode(normalizedSettings.playback.autoplayNextEpisode);
    setDataSaver(normalizedSettings.playback.dataSaver);
    setVideoQuality(normalizedSettings.playback.videoQuality);
  }, [
    normalizedSettings.language,
    normalizedSettings.notifications.marketingEmail,
    normalizedSettings.notifications.pushEnabled,
    normalizedSettings.playback.autoplayNextEpisode,
    normalizedSettings.playback.dataSaver,
    normalizedSettings.playback.videoQuality,
    user?.nickname,
  ]);

  async function handleProfileSave() {
    if (!token) return;
    setSavingProfile(true);
    setError('');
    setStatusMessage('');
    try {
      await api.profile.update(token, { nickname: nickname.trim() });
      if (user) {
        updateUser({ ...user, nickname: nickname.trim() });
      }
      setStatusMessage('Profile saved locally and remotely.');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSettingsSave() {
    if (!token) return;
    setSavingSettings(true);
    setError('');
    setStatusMessage('');
    try {
      await api.settings.updateSettings(token, {
        language,
        notifications: {
          push: { enabled: pushEnabled },
          email: { promoOffers: marketingEmail },
        },
        playback: {
          autoplayNextEpisode,
          dataSaver,
          videoQuality,
        },
      });
      await settingsQuery.refetch();
      setStatusMessage('Preferences updated.');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handlePasswordChange() {
    if (!token || !oldPassword || !newPassword) return;
    setSavingPassword(true);
    setError('');
    setStatusMessage('');
    try {
      await api.profile.changePassword(token, oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setStatusMessage('Password changed.');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  }

  function applyPushPreset(mode: 'route' | 'url', target: string) {
    setPushTestMode(mode);
    setPushTestTarget(target);
  }

  async function handleSendTestPush() {
    if (!token || !pushTestTarget.trim()) return;
    setSendingTestPush(true);
    setError('');
    setStatusMessage('');

    try {
      const payload =
        pushTestMode === 'url'
          ? {
              title: pushTestTitle.trim(),
              body: pushTestBody.trim(),
              url: pushTestTarget.trim(),
            }
          : {
              title: pushTestTitle.trim(),
              body: pushTestBody.trim(),
              route: pushTestTarget.trim(),
            };

      await api.settings.sendTestPush(token, payload);
      setStatusMessage(`Test push queued for ${pushTestMode === 'url' ? 'web target' : 'native route'} ${pushTestTarget.trim()}.`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to send test push.');
    } finally {
      setSendingTestPush(false);
    }
  }

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">Settings</p>
        <h2 className="app-hero-title">Account and playback</h2>
        <p className="app-hero-subtitle">Manage profile, notifications, playback preferences, and account security.</p>
        <div className="meta-pill-row">
          <span className="meta-pill">{pushEnabled ? 'Push on' : 'Push off'}</span>
          <span className="meta-pill">{videoQuality.toUpperCase()} quality</span>
        </div>
      </article>

      <QueryState
        isLoading={settingsQuery.isLoading}
        isFetching={settingsQuery.isFetching}
        error={settingsQuery.error}
        offline={isOffline}
        hasCachedData={Boolean(settingsQuery.data)}
        onRetry={() => {
          void settingsQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={2} title="Loading settings" />}
      >
        <section className="settings-grid">
          <article className="screen-card">
            <p className="screen-eyebrow">Profile</p>
            <div className="auth-form">
              <label className="shell-input-block">
                <span className="shell-input-label">Nickname</span>
                <input className="shell-input" onChange={(event) => setNickname(event.target.value)} value={nickname} />
              </label>
              <button className="app-primary-button shell-button-reset auth-submit" disabled={savingProfile || isOffline} onClick={() => void handleProfileSave()} type="button">
                {savingProfile ? 'Saving...' : isOffline ? 'Offline' : 'Save Profile'}
              </button>
            </div>
          </article>

          <article className="screen-card">
            <p className="screen-eyebrow">Preferences</p>
            <div className="settings-toggle-list">
              <label className="settings-select-block">
                <span className="shell-input-label">Language</span>
                <select className="shell-input" onChange={(event) => setLanguage(event.target.value)} value={language}>
                  <option value="en">English</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="es">Spanish</option>
                </select>
              </label>
              <label className="settings-select-block">
                <span className="shell-input-label">Video Quality</span>
                <select className="shell-input" onChange={(event) => setVideoQuality(event.target.value)} value={videoQuality}>
                  <option value="auto">Auto</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </label>
              <label className="settings-toggle">
                <input checked={pushEnabled} onChange={(event) => setPushEnabled(event.target.checked)} type="checkbox" />
                <span>Push notifications enabled</span>
              </label>
              <div className="settings-runtime-card">
                <div className="settings-runtime-title">Push delivery</div>
                <div className="settings-runtime-copy">{pushSyncStatus}</div>
                {pushPlatform ? <div className="settings-runtime-meta">Platform: {pushPlatform}</div> : null}
                {pushDeviceToken ? (
                  <div className="settings-runtime-meta">Device token ending in {pushDeviceToken.slice(-8)}</div>
                ) : null}
                {pushLastRegisteredAt ? (
                  <div className="settings-runtime-meta">
                    Last registered: {new Date(pushLastRegisteredAt).toLocaleString()}
                  </div>
                ) : null}
              </div>
              <div className="settings-runtime-card">
                <div className="settings-runtime-title">Push test</div>
                <div className="settings-runtime-copy">
                  Send a real backend push to this device and verify notification-center tap routing.
                </div>
                <div className="chip-row">
                  <button
                    className={`shell-button-reset chip ${pushTestMode === 'route' && pushTestTarget === DEFAULT_PUSH_TEST_ROUTE ? 'chip-active' : ''}`}
                    onClick={() => applyPushPreset('route', DEFAULT_PUSH_TEST_ROUTE)}
                    type="button"
                  >
                    Route: Notifications
                  </button>
                  <button
                    className={`shell-button-reset chip ${pushTestMode === 'route' && pushTestTarget === '/user/purchases' ? 'chip-active' : ''}`}
                    onClick={() => applyPushPreset('route', '/user/purchases')}
                    type="button"
                  >
                    Route: Purchases
                  </button>
                  <button
                    className={`shell-button-reset chip ${pushTestMode === 'url' && pushTestTarget === DEFAULT_PUSH_TEST_URL ? 'chip-active' : ''}`}
                    onClick={() => applyPushPreset('url', DEFAULT_PUSH_TEST_URL)}
                    type="button"
                  >
                    Web: About
                  </button>
                </div>
                <label className="settings-select-block">
                  <span className="shell-input-label">Target Type</span>
                  <select
                    className="shell-input"
                    onChange={(event) => {
                      const nextMode = event.target.value === 'url' ? 'url' : 'route';
                      setPushTestMode(nextMode);
                      setPushTestTarget(nextMode === 'url' ? DEFAULT_PUSH_TEST_URL : DEFAULT_PUSH_TEST_ROUTE);
                    }}
                    value={pushTestMode}
                  >
                    <option value="route">Native route</option>
                    <option value="url">Web URL</option>
                  </select>
                </label>
                <label className="shell-input-block">
                  <span className="shell-input-label">{pushTestMode === 'url' ? 'Web URL' : 'Native Route'}</span>
                  <input className="shell-input" onChange={(event) => setPushTestTarget(event.target.value)} value={pushTestTarget} />
                </label>
                <label className="shell-input-block">
                  <span className="shell-input-label">Push Title</span>
                  <input className="shell-input" onChange={(event) => setPushTestTitle(event.target.value)} value={pushTestTitle} />
                </label>
                <label className="shell-input-block">
                  <span className="shell-input-label">Push Body</span>
                  <input className="shell-input" onChange={(event) => setPushTestBody(event.target.value)} value={pushTestBody} />
                </label>
                <button
                  className="app-primary-button shell-button-reset"
                  disabled={sendingTestPush || isOffline || !pushDeviceToken || !token}
                  onClick={() => void handleSendTestPush()}
                  type="button"
                >
                  {sendingTestPush ? 'Sending push...' : isOffline ? 'Offline' : !pushDeviceToken ? 'Waiting for device token' : 'Send Test Push'}
                </button>
              </div>
              <label className="settings-toggle">
                <input checked={marketingEmail} onChange={(event) => setMarketingEmail(event.target.checked)} type="checkbox" />
                <span>Marketing emails enabled</span>
              </label>
              <label className="settings-toggle">
                <input checked={autoplayNextEpisode} onChange={(event) => setAutoplayNextEpisode(event.target.checked)} type="checkbox" />
                <span>Autoplay next episode</span>
              </label>
              <label className="settings-toggle">
                <input checked={dataSaver} onChange={(event) => setDataSaver(event.target.checked)} type="checkbox" />
                <span>Data saver mode</span>
              </label>
              <button className="app-primary-button shell-button-reset auth-submit" disabled={savingSettings || isOffline} onClick={() => void handleSettingsSave()} type="button">
                {savingSettings ? 'Updating...' : isOffline ? 'Offline' : 'Save Preferences'}
              </button>
            </div>
          </article>

          <article className="screen-card">
            <p className="screen-eyebrow">Security</p>
            <div className="auth-form">
              <label className="shell-input-block">
                <span className="shell-input-label">Current Password</span>
                <input className="shell-input" onChange={(event) => setOldPassword(event.target.value)} type="password" value={oldPassword} />
              </label>
              <label className="shell-input-block">
                <span className="shell-input-label">New Password</span>
                <input className="shell-input" onChange={(event) => setNewPassword(event.target.value)} type="password" value={newPassword} />
              </label>
              <button className="app-primary-button shell-button-reset auth-submit" disabled={savingPassword || isOffline} onClick={() => void handlePasswordChange()} type="button">
                {savingPassword ? 'Updating...' : isOffline ? 'Offline' : 'Change Password'}
              </button>
            </div>
          </article>
        </section>

        {statusMessage ? <div className="auth-success">{statusMessage}</div> : null}
        {error ? <div className="auth-error">{error}</div> : null}
      </QueryState>
    </section>
  );
}
