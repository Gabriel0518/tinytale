"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { dramasApi } from "@/lib/api";

interface Drama {
  _id: string;
  title: string;
  coverImage?: string;
  cover?: string;
  rating?: number;
  status?: string;
  isVip?: boolean;
}

export default function NotFoundPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dramas, setDramas] = useState<Drama[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dramasApi.getAll({ limit: 5, sort: "popular" });
        const list = res.data?.dramas || res.data || [];
        setDramas(list.slice(0, 5));
      } catch {}
    };
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="keyboard-safe-form relative min-h-screen overflow-hidden bg-[#121212] text-white">
      <style jsx>{`
        @keyframes grain { 0%,100% { transform: translate(0,0); } 10% { transform: translate(-5%,-10%); } 30% { transform: translate(3%,-15%); } 50% { transform: translate(12%,9%); } 70% { transform: translate(9%,4%); } 90% { transform: translate(-1%,7%); } }
        @keyframes reelSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .film-grain { position: fixed; inset: -50%; width: 200%; height: 200%; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E"); animation: grain 0.5s steps(6) infinite; pointer-events: none; opacity: 0.12; z-index: 1; will-change: transform; }
      `}</style>

      {/* Film Grain Overlay */}
      <div className="film-grain" />

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-[#121212]/95 to-[#121212] z-0" />

      {/* Giant 404 Background Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 select-none pointer-events-none">
        <span className="text-[180px] md:text-[240px] font-black text-white/[0.03] leading-none tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>404</span>
      </div>

      {/* Spinning Film Reel - Left */}
      <div className="absolute top-32 -left-16 z-0 opacity-10" style={{ animation: "reelSpin 10s linear infinite" }}>
        <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="50" cy="50" r="45" /><circle cx="50" cy="50" r="35" /><circle cx="50" cy="50" r="12" />
          <circle cx="50" cy="20" r="5" /><circle cx="50" cy="80" r="5" /><circle cx="20" cy="50" r="5" /><circle cx="80" cy="50" r="5" />
          {Array.from({ length: 24 }).map((_, i) => <line key={i} x1="50" y1="5" x2="50" y2="8" transform={`rotate(${i * 15} 50 50)`} strokeWidth="1.5" />)}
        </svg>
      </div>

      {/* Spinning Film Reel - Right */}
      <div className="absolute bottom-20 -right-12 z-0 opacity-[0.06]" style={{ animation: "reelSpin 15s linear infinite reverse" }}>
        <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="50" cy="50" r="45" /><circle cx="50" cy="50" r="35" /><circle cx="50" cy="50" r="12" />
          <circle cx="50" cy="20" r="5" /><circle cx="50" cy="80" r="5" /><circle cx="20" cy="50" r="5" /><circle cx="80" cy="50" r="5" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4 pt-20">
        {/* Clapperboard */}
        <div className="mb-8 relative">
          <div className="w-32 h-8 bg-gradient-to-r from-gray-800 to-gray-700 rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 flex">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-1 odd:bg-white/10" style={{ transform: "skewX(-15deg)" }} />
              ))}
            </div>
          </div>
          <div className="w-32 h-20 bg-gray-900 border border-gray-700 rounded-b-lg flex items-center justify-center">
            <span className="text-3xl font-black text-red-500" style={{ fontFamily: "'Playfair Display', serif" }}>404</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black mb-3 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
          Scene Not Found
        </h1>
        <p className="text-gray-400 text-center max-w-md mb-8 leading-relaxed">
          Looks like this scene was left on the cutting room floor. Let&apos;s get you back to the main feature.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-md mb-8 relative">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for dramas, actors..."
              enterKeyHint="search"
              inputMode="search"
              className="w-full bg-[#2A2A2A] border border-white/10 rounded-full pl-12 pr-10 py-3.5 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href="/" className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold transition hover:scale-105 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            Back to Home
          </Link>
          <Link href="/browse" className="px-6 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-medium transition hover:scale-105">
            Browse Dramas
          </Link>
        </div>
      </div>

      {/* Trending Recommendations */}
      {dramas.length > 0 && (
        <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20 mt-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">While you&apos;re here...</h2>
            <Link href="/browse" className="text-sm text-red-400 hover:text-red-300 transition flex items-center gap-1">
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {dramas.map(d => (
              <Link key={d._id} href={`/drama/${d._id}`} className="group relative rounded-xl overflow-hidden bg-zinc-900 aspect-[2/3]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                {(d.coverImage || d.cover) ? (
                  <Image src={d.coverImage || d.cover || ""} alt={d.title} fill className="object-cover transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125" /></svg>
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 z-20 flex gap-1.5">
                  {d.isVip && <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded">VIP</span>}
                  {d.status === "hot" && <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">HOT</span>}
                  {d.status === "new" && <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded">NEW</span>}
                </div>
                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
                  <p className="text-sm font-semibold text-white truncate">{d.title}</p>
                  {d.rating && <p className="text-xs text-yellow-400 mt-0.5">★ {d.rating}</p>}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 z-10 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="px-4 py-2 bg-red-600 rounded-lg text-sm font-bold">Watch Now</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
