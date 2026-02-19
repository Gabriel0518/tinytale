'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { promoterApi } from '@/lib/api';

export default function AffiliatePendingPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    if (!token) return;
    setChecking(true);
    try {
      const res = await promoterApi.getProfile(token);
      const status = res?.data?.status;
      if (status === 'active') {
        router.push('/affiliate/dashboard');
      } else if (status === 'rejected') {
        router.push('/affiliate/apply');
      }
    } catch {
      // still pending or error — stay on page
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Checkmark Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
          <svg
            className="h-10 w-10 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl font-bold text-white mb-3">Application Submitted</h1>
        <p className="text-gray-400 mb-10 leading-relaxed">
          Your application is under review. We&apos;ll get back to you within 24 hours.
        </p>

        {/* While You Wait Section */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-400 mb-4">
            While You Wait
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Pre-study Documentation Card */}
            <a
              href="/affiliate"
              className="block rounded-xl bg-[#13131d] border border-gray-800/50 p-5 text-left transition hover:border-purple-500/40 hover:bg-[#1a1a2e]"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Pre-study Documentation</h3>
              <p className="text-xs text-gray-500">Review the affiliate program details and commission structure.</p>
            </a>

            {/* Join Our Community Card */}
            <div className="rounded-xl bg-[#13131d] border border-gray-800/50 p-5 text-left">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">Join Our Community</h3>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#1a1a2e] px-3 py-1.5 text-xs text-gray-300 transition hover:text-white"
                >
                  Telegram
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#1a1a2e] px-3 py-1.5 text-xs text-gray-300 transition hover:text-white"
                >
                  Discord
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Check Status Button */}
        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checking ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking...
            </>
          ) : (
            'Check Status'
          )}
        </button>
      </div>
    </div>
  );
}
