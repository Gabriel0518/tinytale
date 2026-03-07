"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { coinsApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";

function VIPSuccessContent() {
  const { token, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!sessionId || !token) return;
    const verify = async () => {
      try {
        const res = await coinsApi.verifySession(token, sessionId);
        const d = res.data;
        if (d.status === "paid" && d.transactionStatus === "completed") {
          setAmount(d.amount);
          setStatus("success");
          await refreshUser();
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };
    verify();
  }, [sessionId, token, refreshUser]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-32 pb-20 text-center">
      {status === "loading" && (
        <div className="w-10 h-10 mx-auto border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      )}
      {status === "success" && (
        <>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">Welcome to TinyTale Premium!</h1>
          <p className="text-gray-400 mb-6">
            ${amount.toFixed(2)} paid successfully. Your VIP membership is now active.
          </p>
          <div className="bg-zinc-900/60 rounded-xl border border-yellow-500/20 p-6 mb-8">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-400">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" /></svg>
              <span>VIP Activated</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">Enjoy ad-free viewing, early access, and all premium benefits</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/user/subscription" className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition">
              View Subscription
            </Link>
            <Link href="/" className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl text-sm font-bold transition">
              Start Watching
            </Link>
          </div>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">Payment Issue</h1>
          <p className="text-gray-400 mb-6">We couldn&apos;t verify your payment. If you were charged, your VIP membership will be activated shortly.</p>
          <Link href="/user/subscription" className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl text-sm font-bold transition">
            Back to Subscription
          </Link>
        </>
      )}
    </div>
  );
}

export default function VIPSuccessPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Suspense fallback={<div className="max-w-lg mx-auto px-4 pt-32 pb-20 text-center"><div className="w-10 h-10 mx-auto border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <VIPSuccessContent />
      </Suspense>
    </div>
  );
}
