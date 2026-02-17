import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-primary/10">
        <span className="text-5xl font-bold text-accent-primary">4</span>
        <span className="text-5xl font-bold text-white">0</span>
        <span className="text-5xl font-bold text-accent-primary">4</span>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-white">Page Not Found</h1>
      <p className="mb-8 max-w-md text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-accent-primary px-6 py-3 font-medium text-white transition hover:bg-red-700"
        >
          Back to Home
        </Link>
        <Link
          href="/browse"
          className="rounded-lg border border-white/10 bg-bg-elevated px-6 py-3 font-medium text-white transition hover:bg-white/10"
        >
          Browse Dramas
        </Link>
      </div>
    </div>
  );
}
