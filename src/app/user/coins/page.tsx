"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus: number;
}

export default function CoinsPage() {
  const { user, token, updateUser } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !loading) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Fetch coin packages
    const fetchPackages = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7003'}/api/payment/packages`);
        const data = await response.json();
        if (data.success) {
          setPackages(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch packages:', error);
        // Fallback packages
        setPackages([
          { id: '1', coins: 100, price: 0.99, bonus: 0 },
          { id: '2', coins: 500, price: 4.99, bonus: 25 },
          { id: '3', coins: 1000, price: 9.99, bonus: 100 },
          { id: '4', coins: 2000, price: 19.99, bonus: 300 },
          { id: '5', coins: 5000, price: 49.99, bonus: 1000 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPackages();
    }
  }, [user]);

  const handlePurchase = async (pkgId: string) => {
    if (!token) return;

    setProcessing(true);
    setSelectedPackage(pkgId);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7003'}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: pkgId, paymentMethod: 'credit_card' }),
      });

      const data = await response.json();

      if (data.success) {
        // Update user coins
        if (user) {
          updateUser({ ...user, coins: (user.coins || 0) + data.data.coinsAdded });
        }
        alert(`Successfully purchased ${data.data.coinsAdded} coins!`);
      } else {
        alert(data.error?.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setProcessing(false);
      setSelectedPackage(null);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 bg-[#141414]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <span className="text-xl font-bold text-white">TinyTale</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/user/profile" className="text-sm font-medium text-gray-300 hover:text-white">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-12">
        <div className="mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Recharge Coins</h1>
            <p className="mt-2 text-gray-400">Purchase coins to unlock premium episodes</p>
          </div>

          {/* Current Balance */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Current Balance</p>
                <p className="mt-2 text-4xl font-bold">{user.coins || 0} Coins</p>
              </div>
              <div className="text-6xl">🪙</div>
            </div>
          </div>

          {/* Coin Packages */}
          <h2 className="mb-4 text-xl font-semibold text-white">Select Package</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handlePurchase(pkg.id)}
                disabled={processing}
                className={`relative flex flex-col items-center rounded-xl border p-6 transition ${
                  selectedPackage === pkg.id
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                }`}
              >
                {pkg.bonus > 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                    +{pkg.bonus} BONUS
                  </div>
                )}
                <div className="text-3xl font-bold text-yellow-500">{pkg.coins + pkg.bonus}</div>
                <div className="text-sm text-gray-400">Coins</div>
                <div className="mt-4 text-xl font-bold text-white">${pkg.price}</div>
                {processing && selectedPackage === pkg.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-white">Payment Methods</h2>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" />
                </svg>
                Credit Card
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
                </svg>
                PayPal
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z"/>
                </svg>
                Apple Pay
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-8 rounded-lg bg-gray-900 p-4">
            <h3 className="font-semibold text-white">Note:</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-gray-400">
              <li>Coins are non-refundable</li>
              <li>Bonus coins are valid for 30 days</li>
              <li>1 coin = approximately $0.01 USD</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
