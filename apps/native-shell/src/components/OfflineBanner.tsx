export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="offline-banner" role="status">
      <strong>Offline mode</strong>
      <span>Showing local shell and cached surfaces while the network is unavailable.</span>
    </div>
  );
}
