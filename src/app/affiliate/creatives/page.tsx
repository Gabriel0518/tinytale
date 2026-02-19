"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";

interface Creative {
  _id: string;
  title: string;
  type: string;
  thumbnail: string;
  width: number;
  height: number;
  fileSize: string;
  dramaId: string;
  downloadUrl: string;
}

const TYPE_TABS = ["All", "Clips", "Posters", "Banners", "Videos"];
const SOURCE_OPTIONS = ["Social Media", "Email", "Blog", "YouTube", "TikTok", "Other"];

export default function CreativesPage() {
  const { token } = useAuth();
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrama, setSelectedDrama] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [dramas, setDramas] = useState<{ _id: string; title: string }[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [linkDrama, setLinkDrama] = useState("");
  const [linkSource, setLinkSource] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    promoterApi.getReferralLink(token).then((res: any) => {
      if (res.success) {
        const code = res.data?.referralCode || res.data?.code || "";
        setReferralCode(code);
      }
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchCreatives();
  }, [token, selectedDrama, activeTab]);

  const fetchCreatives = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: { dramaId?: string; type?: string } = {};
      if (selectedDrama) params.dramaId = selectedDrama;
      if (activeTab !== "All") params.type = activeTab.toLowerCase();
      const res: any = await promoterApi.getCreatives(token, params);
      if (res.success) {
        setCreatives(res.data?.creatives || res.data || []);
        if (res.data?.dramas) setDramas(res.data.dramas);
      }
    } catch {
      setCreatives([]);
    } finally {
      setLoading(false);
    }
  };

  const generatedLink = referralCode
    ? `tinytale.top/ref/${referralCode}${linkDrama ? `/${linkDrama}` : ""}${linkSource ? `?src=${encodeURIComponent(linkSource)}` : ""}`
    : "";

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f0f17] text-gray-200 p-6">
      <h1 className="text-2xl font-bold mb-6">Creative Assets</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Creatives Browser (~60%) */}
        <div className="w-full lg:w-[60%]">
          <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5">
            {/* Drama selector */}
            <select
              value={selectedDrama}
              onChange={(e) => setSelectedDrama(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-200 mb-4 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Dramas</option>
              {dramas.map((d) => (
                <option key={d._id} value={d._id}>{d.title}</option>
              ))}
            </select>

            {/* Type tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "bg-purple-600 text-white"
                      : "bg-[#1a1a2e] text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#1a1a2e] rounded-lg p-4 animate-pulse">
                    <div className="h-32 bg-gray-700/30 rounded-lg mb-3" />
                    <div className="h-4 w-3/4 bg-gray-700/30 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-gray-700/30 rounded" />
                  </div>
                ))}
              </div>
            ) : creatives.length === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-12 w-12 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <p className="text-gray-500 text-sm">No creatives found</p>
                <p className="text-gray-600 text-xs mt-1">Try selecting a different drama or type</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {creatives.map((c) => (
                  <div key={c._id} className="bg-[#1a1a2e] border border-gray-800/30 rounded-lg overflow-hidden group">
                    {/* Thumbnail placeholder */}
                    <div
                      className="h-36 w-full"
                      style={{
                        background: c.thumbnail
                          ? `url(${c.thumbnail}) center/cover`
                          : "linear-gradient(135deg, #6b21a8 0%, #312e81 50%, #0f172a 100%)",
                      }}
                    />
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-200 truncate">{c.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {c.width}x{c.height} &middot; {c.fileSize}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <a
                          href={c.downloadUrl}
                          download
                          className="flex-1 text-center text-xs font-medium py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                        >
                          Download
                        </a>
                        <button className="flex-1 text-xs font-medium py-1.5 rounded-md border border-gray-700/50 text-gray-300 hover:bg-[#13131d] transition-colors">
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Deep Link Generator (~40%) */}
        <div className="w-full lg:w-[40%]">
          <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Deep Link Generator</h2>

            {/* Select Drama */}
            <label className="block text-sm text-gray-400 mb-1.5">Select Drama</label>
            <select
              value={linkDrama}
              onChange={(e) => setLinkDrama(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-200 mb-4 focus:outline-none focus:border-purple-500"
            >
              <option value="">Choose a drama</option>
              {dramas.map((d) => (
                <option key={d._id} value={d._id}>{d.title}</option>
              ))}
            </select>

            {/* Select Source */}
            <label className="block text-sm text-gray-400 mb-1.5">Select Source</label>
            <select
              value={linkSource}
              onChange={(e) => setLinkSource(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-200 mb-4 focus:outline-none focus:border-purple-500"
            >
              <option value="">Choose a source</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Generated Link */}
            <label className="block text-sm text-gray-400 mb-1.5">Generated Link</label>
            <div className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 break-all min-h-[40px] mb-4">
              {generatedLink || <span className="text-gray-600">Select options above to generate a link</span>}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              disabled={!generatedLink}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : generatedLink
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>

            {/* Pro Tip */}
            <div className="mt-5 bg-purple-900/20 border border-purple-800/30 rounded-lg p-3.5">
              <p className="text-xs text-purple-300">
                <span className="font-semibold">Pro Tip:</span> Use unique source tags to track which channels perform best.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
