"use client";

import { useState } from "react";
import Image from "next/image";
import { Navbar } from "@/components/features/Navbar";
import { DramaCard } from "@/components/features/DramaCard";
import { mockDramas } from "@/lib/mockData";

type Tab = "favorites" | "history" | "coins";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("favorites");
  const [coins] = useState(500);

  const mockUser = {
    nickname: "MovieLover",
    email: "user@example.com",
    avatar: "https://picsum.photos/seed/avatar/200/200",
    joinedDate: "January 2024",
  };

  const favorites = mockDramas.slice(0, 3);
  const history = mockDramas.slice(2, 5);

  const tabs = [
    { id: "favorites" as const, label: "Favorites", count: favorites.length },
    { id: "history" as const, label: "History", count: history.length },
    { id: "coins" as const, label: "Coins", count: coins },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="pt-20 pb-12">
        {/* Profile Header */}
        <div className="bg-bg-secondary py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col items-center md:flex-row md:gap-8">
              {/* Avatar */}
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-bg-primary md:h-32 md:w-32">
                  <Image
                    src={mockUser.avatar}
                    alt={mockUser.nickname}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <div className="mt-4 text-center md:mt-0 md:text-left">
                <h1 className="text-2xl font-bold text-text-primary">{mockUser.nickname}</h1>
                <p className="text-text-secondary">{mockUser.email}</p>
                <p className="mt-1 text-sm text-text-tertiary">Joined {mockUser.joinedDate}</p>

                {/* Quick Stats */}
                <div className="mt-4 flex justify-center gap-6 md:justify-start">
                  <div className="text-center">
                    <div className="text-xl font-bold text-accent-gold">{coins}</div>
                    <div className="text-xs text-text-tertiary">Coins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-text-primary">{favorites.length}</div>
                    <div className="text-xs text-text-tertiary">Favorites</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-text-primary">{history.length}</div>
                    <div className="text-xs text-text-tertiary">Watched</div>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-4 md:ml-auto">
                <button className="rounded-lg bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-gray-600">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="mt-6 flex gap-2 border-b border-bg-elevated">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
                <span className="ml-2 rounded-full bg-bg-elevated px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "favorites" && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-text-primary">My Favorites</h2>
                {favorites.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                    {favorites.map((drama) => (
                      <DramaCard key={drama.id} drama={drama} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-text-tertiary">No favorites yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-primary">Watch History</h2>
                  <button className="text-sm text-text-tertiary hover:text-text-primary">Clear All</button>
                </div>
                {history.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                    {history.map((drama) => (
                      <DramaCard key={drama.id} drama={drama} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-text-tertiary">No watch history</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "coins" && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-text-primary">My Coins</h2>

                {/* Current Balance */}
                <div className="mb-8 rounded-xl bg-gradient-to-r from-accent-primary to-red-700 p-6 text-white">
                  <p className="text-sm opacity-80">Current Balance</p>
                  <p className="mt-2 text-4xl font-bold">{coins} Coins</p>
                  <button className="mt-4 rounded-lg bg-white px-6 py-2 font-medium text-accent-primary transition hover:bg-gray-100">
                    Recharge
                  </button>
                </div>

                {/* Coin Packages */}
                <h3 className="mb-4 text-lg font-semibold text-text-primary">Recharge</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { amount: 100, price: 0.99 },
                    { amount: 500, price: 4.99 },
                    { amount: 1000, price: 9.99 },
                    { amount: 2000, price: 19.99 },
                  ].map((pkg) => (
                    <button
                      key={pkg.amount}
                      className="flex flex-col items-center rounded-xl border border-bg-elevated bg-bg-secondary p-4 transition hover:border-accent-primary"
                    >
                      <div className="text-2xl font-bold text-accent-gold">{pkg.amount}</div>
                      <div className="text-sm text-text-secondary">Coins</div>
                      <div className="mt-2 font-medium text-text-primary">${pkg.price}</div>
                    </button>
                  ))}
                </div>

                {/* Transaction History */}
                <h3 className="mb-4 mt-8 text-lg font-semibold text-text-primary">Recent Transactions</h3>
                <div className="rounded-xl border border-bg-elevated bg-bg-secondary">
                  {[
                    { type: "unlock", amount: -100, desc: "Unlock Episode 5", date: "Feb 14, 2024" },
                    { type: "recharge", amount: 500, desc: "Recharge", date: "Feb 10, 2024" },
                    { type: "recharge", amount: 100, desc: "Recharge", date: "Feb 5, 2024" },
                  ].map((tx, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-bg-elevated p-4 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-text-primary">{tx.desc}</p>
                        <p className="text-sm text-text-tertiary">{tx.date}</p>
                      </div>
                      <span className={tx.amount > 0 ? "text-accent-success" : "text-accent-primary"}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount} Coins
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
