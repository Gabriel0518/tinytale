"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { coinsApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";

export default function PaymentSuccessPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [coins, setCoins] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!sessionId || !token) return;
    const verify = async () => {
      try {
        const res = await coinsApi.verifySession(token, sessionId);
        const d = res.data;
        if (d.status === "paid" && d.transactionStatus === "completed") {
          setCoins(d.coins);
          setBonus(d.bonus);
          setAmount(d.amount);
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };
    verify();
  }, [sessionId, token]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
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
            <h1 className="text-3xl font-bold mb-3">Payment Successful</h1>
            <p className="text-gray-400 mb-6">
              ${amount.toFixed(2)} paid successfully
            </p>
            <div className="bg-zinc-900/60 rounded-xl border border-yellow-500/20 p-6 mb-8">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-400">
                <span>+{coins.toLocaleString()}</span>
                <span className="text-base text-gray-400">coins</span>
              </div>
              {bonus > 0 && (
                <p className="text-green-400 text-sm mt-2">+{bonus.toLocaleString()} Bonus Coins</p>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/user/coins" className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition">
                Buy More
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
            <p className="text-gray-400 mb-6">We couldn&apos;t verify your payment. If you were charged, your coins will be credited shortly.</p>
            <Link href="/user/coins" className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl text-sm font-bold transition">
              Back to Coins
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
