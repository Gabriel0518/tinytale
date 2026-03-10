"use client";
export const dynamic = 'force-dynamic';


import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { promoterApi, dramasApi } from "@/lib/api";
import { detectClientLocale, SupportedLocale } from "@/lib/i18n";

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

const TYPE_TABS = ["all", "clips", "posters", "banners", "videos"] as const;
const SOURCE_OPTIONS = ["Social Media", "Email", "Blog", "YouTube", "TikTok", "Other"] as const;

type CreativesCopy = {
  pageTitle: string;
  allDramas: string;
  tabs: Record<(typeof TYPE_TABS)[number], string>;
  noCreatives: string;
  noCreativesHintWithDrama: string;
  noCreativesHintNoDrama: string;
  download: string;
  save: string;
  deepLinkTitle: string;
  selectDrama: string;
  chooseDrama: string;
  selectSource: string;
  chooseSource: string;
  sourceLabels: Record<(typeof SOURCE_OPTIONS)[number], string>;
  generatedLink: string;
  linkPlaceholder: string;
  copyLink: string;
  copied: string;
  proTipTitle: string;
  proTipText: string;
  coverImage: string;
};

const COPY: Record<SupportedLocale, CreativesCopy> = {
  en: {
    pageTitle: "Creative Assets",
    allDramas: "All Dramas",
    tabs: { all: "All", clips: "Clips", posters: "Posters", banners: "Banners", videos: "Videos" },
    noCreatives: "No creatives found",
    noCreativesHintWithDrama: "Try selecting a different type",
    noCreativesHintNoDrama: "Select a drama above to view its creative assets",
    download: "Download",
    save: "Save",
    deepLinkTitle: "Deep Link Generator",
    selectDrama: "Select Drama",
    chooseDrama: "Choose a drama",
    selectSource: "Select Source",
    chooseSource: "Choose a source",
    sourceLabels: {
      "Social Media": "Social Media",
      Email: "Email",
      Blog: "Blog",
      YouTube: "YouTube",
      TikTok: "TikTok",
      Other: "Other",
    },
    generatedLink: "Generated Link",
    linkPlaceholder: "Select options above to generate a link",
    copyLink: "Copy Link",
    copied: "Copied!",
    proTipTitle: "Pro Tip:",
    proTipText: "Use unique source tags to track which channels perform best.",
    coverImage: "Cover Image",
  },
  zh: {
    pageTitle: "素材中心",
    allDramas: "全部短剧",
    tabs: { all: "全部", clips: "片段", posters: "海报", banners: "横幅", videos: "视频" },
    noCreatives: "暂无素材",
    noCreativesHintWithDrama: "试试切换素材类型",
    noCreativesHintNoDrama: "请先选择短剧以查看对应素材",
    download: "下载",
    save: "保存",
    deepLinkTitle: "深链生成器",
    selectDrama: "选择短剧",
    chooseDrama: "请选择短剧",
    selectSource: "选择来源",
    chooseSource: "请选择来源",
    sourceLabels: {
      "Social Media": "社交媒体",
      Email: "邮件",
      Blog: "博客",
      YouTube: "YouTube",
      TikTok: "TikTok",
      Other: "其他",
    },
    generatedLink: "生成链接",
    linkPlaceholder: "选择上方选项后自动生成链接",
    copyLink: "复制链接",
    copied: "已复制",
    proTipTitle: "小贴士：",
    proTipText: "为不同渠道使用唯一来源标记，便于分析转化效果。",
    coverImage: "封面图",
  },
  ja: {
    pageTitle: "クリエイティブ素材",
    allDramas: "すべてのドラマ",
    tabs: { all: "すべて", clips: "クリップ", posters: "ポスター", banners: "バナー", videos: "動画" },
    noCreatives: "素材が見つかりません",
    noCreativesHintWithDrama: "別のタイプを選択してください",
    noCreativesHintNoDrama: "上でドラマを選択すると素材が表示されます",
    download: "ダウンロード",
    save: "保存",
    deepLinkTitle: "ディープリンク生成",
    selectDrama: "ドラマを選択",
    chooseDrama: "ドラマを選択してください",
    selectSource: "流入元を選択",
    chooseSource: "流入元を選択してください",
    sourceLabels: {
      "Social Media": "SNS",
      Email: "メール",
      Blog: "ブログ",
      YouTube: "YouTube",
      TikTok: "TikTok",
      Other: "その他",
    },
    generatedLink: "生成リンク",
    linkPlaceholder: "上の項目を選ぶとリンクが生成されます",
    copyLink: "リンクをコピー",
    copied: "コピーしました",
    proTipTitle: "ヒント：",
    proTipText: "チャネルごとに異なる source タグを使うと効果測定しやすくなります。",
    coverImage: "カバー画像",
  },
  es: {
    pageTitle: "Recursos creativos",
    allDramas: "Todos los dramas",
    tabs: { all: "Todo", clips: "Clips", posters: "Pósters", banners: "Banners", videos: "Videos" },
    noCreatives: "No se encontraron recursos",
    noCreativesHintWithDrama: "Prueba con otro tipo",
    noCreativesHintNoDrama: "Selecciona un drama para ver sus recursos",
    download: "Descargar",
    save: "Guardar",
    deepLinkTitle: "Generador de enlaces profundos",
    selectDrama: "Seleccionar drama",
    chooseDrama: "Elige un drama",
    selectSource: "Seleccionar fuente",
    chooseSource: "Elige una fuente",
    sourceLabels: {
      "Social Media": "Redes sociales",
      Email: "Correo",
      Blog: "Blog",
      YouTube: "YouTube",
      TikTok: "TikTok",
      Other: "Otro",
    },
    generatedLink: "Enlace generado",
    linkPlaceholder: "Selecciona opciones para generar un enlace",
    copyLink: "Copiar enlace",
    copied: "Copiado",
    proTipTitle: "Consejo:",
    proTipText: "Usa etiquetas de fuente únicas para medir mejor el rendimiento por canal.",
    coverImage: "Imagen de portada",
  },
  pt: {
    pageTitle: "Materiais criativos",
    allDramas: "Todos os dramas",
    tabs: { all: "Todos", clips: "Clipes", posters: "Pôsteres", banners: "Banners", videos: "Vídeos" },
    noCreatives: "Nenhum material encontrado",
    noCreativesHintWithDrama: "Tente outro tipo",
    noCreativesHintNoDrama: "Selecione um drama para ver os materiais",
    download: "Baixar",
    save: "Salvar",
    deepLinkTitle: "Gerador de deep link",
    selectDrama: "Selecionar drama",
    chooseDrama: "Escolha um drama",
    selectSource: "Selecionar origem",
    chooseSource: "Escolha uma origem",
    sourceLabels: {
      "Social Media": "Redes sociais",
      Email: "E-mail",
      Blog: "Blog",
      YouTube: "YouTube",
      TikTok: "TikTok",
      Other: "Outro",
    },
    generatedLink: "Link gerado",
    linkPlaceholder: "Selecione as opções acima para gerar um link",
    copyLink: "Copiar link",
    copied: "Copiado",
    proTipTitle: "Dica:",
    proTipText: "Use tags de origem únicas para medir melhor o desempenho por canal.",
    coverImage: "Imagem de capa",
  },
  hi: {
    pageTitle: "क्रिएटिव एसेट्स",
    allDramas: "सभी ड्रामा",
    tabs: { all: "सभी", clips: "क्लिप्स", posters: "पोस्टर", banners: "बैनर", videos: "वीडियो" },
    noCreatives: "कोई एसेट नहीं मिला",
    noCreativesHintWithDrama: "कोई दूसरा प्रकार चुनें",
    noCreativesHintNoDrama: "एसेट देखने के लिए ऊपर से ड्रामा चुनें",
    download: "डाउनलोड",
    save: "सेव",
    deepLinkTitle: "डीप लिंक जनरेटर",
    selectDrama: "ड्रामा चुनें",
    chooseDrama: "एक ड्रामा चुनें",
    selectSource: "स्रोत चुनें",
    chooseSource: "एक स्रोत चुनें",
    sourceLabels: {
      "Social Media": "सोशल मीडिया",
      Email: "ईमेल",
      Blog: "ब्लॉग",
      YouTube: "YouTube",
      TikTok: "TikTok",
      Other: "अन्य",
    },
    generatedLink: "जनरेटेड लिंक",
    linkPlaceholder: "लिंक बनाने के लिए ऊपर विकल्प चुनें",
    copyLink: "लिंक कॉपी करें",
    copied: "कॉपी हो गया",
    proTipTitle: "प्रो टिप:",
    proTipText: "हर चैनल के लिए अलग source टैग उपयोग करें ताकि प्रदर्शन ट्रैक हो सके।",
    coverImage: "कवर इमेज",
  },
  id: {
    pageTitle: "Aset kreatif",
    allDramas: "Semua drama",
    tabs: { all: "Semua", clips: "Klip", posters: "Poster", banners: "Banner", videos: "Video" },
    noCreatives: "Tidak ada aset ditemukan",
    noCreativesHintWithDrama: "Coba pilih tipe lain",
    noCreativesHintNoDrama: "Pilih drama untuk melihat aset promosinya",
    download: "Unduh",
    save: "Simpan",
    deepLinkTitle: "Generator deep link",
    selectDrama: "Pilih drama",
    chooseDrama: "Pilih drama",
    selectSource: "Pilih sumber",
    chooseSource: "Pilih sumber",
    sourceLabels: {
      "Social Media": "Media sosial",
      Email: "Email",
      Blog: "Blog",
      YouTube: "YouTube",
      TikTok: "TikTok",
      Other: "Lainnya",
    },
    generatedLink: "Tautan hasil",
    linkPlaceholder: "Pilih opsi di atas untuk membuat tautan",
    copyLink: "Salin tautan",
    copied: "Tersalin",
    proTipTitle: "Tips:",
    proTipText: "Gunakan tag sumber unik untuk melacak performa tiap kanal.",
    coverImage: "Gambar sampul",
  },
};

export default function CreativesPage() {
  const pathname = usePathname();
  const locale = useMemo(() => detectClientLocale(pathname), [pathname]);
  const t = COPY[locale] || COPY.en;
  const { token } = useAuth();
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrama, setSelectedDrama] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof TYPE_TABS)[number]>("all");
  const [dramas, setDramas] = useState<{ _id: string; title: string; cover?: string; horizontalCover?: string }[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [linkDrama, setLinkDrama] = useState("");
  const [linkSource, setLinkSource] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch dramas list from public API
  useEffect(() => {
    dramasApi.getAll({ limit: 100 }).then((res: any) => {
      if (res.success) {
        const list = res.data?.dramas || res.data || [];
        setDramas(list.map((d: any) => ({ _id: d._id, title: d.title, cover: d.cover, horizontalCover: d.horizontalCover })));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    promoterApi.getReferralLink(token).then((res: any) => {
      if (res.success) {
        const code = res.data?.referralCode || res.data?.code || "";
        setReferralCode(code);
      }
    }).catch(() => {});
  }, [token]);

  // Build creatives from selected drama's covers + any API creatives
  const [apiCreatives, setApiCreatives] = useState<Creative[]>([]);

  useEffect(() => {
    if (!token) return;
    const params: { dramaId?: string; type?: string } = {};
    if (selectedDrama) params.dramaId = selectedDrama;
    if (activeTab !== "all") params.type = activeTab;
    promoterApi.getCreatives(token, params).then((res: any) => {
      if (res.success) {
        setApiCreatives(res.data?.creatives || []);
      }
    }).catch(() => setApiCreatives([]));
  }, [token, selectedDrama, activeTab]);

  // Derive display creatives: API creatives + drama cover fallback
  useEffect(() => {
    if (!selectedDrama) {
      setCreatives(apiCreatives);
      setLoading(false);
      return;
    }
    const drama = dramas.find((d) => d._id === selectedDrama);
    const coverItems: Creative[] = [];
    if (drama?.cover && (activeTab === "all" || activeTab === "posters")) {
      coverItems.push({
        _id: `cover-${drama._id}`,
        title: `${drama.title} - Cover`,
        type: "posters",
        thumbnail: drama.cover,
        width: 400,
        height: 600,
        fileSize: t.coverImage,
        dramaId: drama._id,
        downloadUrl: drama.cover,
      });
    }
    if (drama?.horizontalCover && (activeTab === "all" || activeTab === "banners")) {
      coverItems.push({
        _id: `hcover-${drama._id}`,
        title: `${drama.title} - Banner`,
        type: "banners",
        thumbnail: drama.horizontalCover,
        width: 1920,
        height: 1080,
        fileSize: t.coverImage,
        dramaId: drama._id,
        downloadUrl: drama.horizontalCover,
      });
    }
    // Merge: cover items first, then any API creatives (deduplicated)
    const apiIds = new Set(apiCreatives.map((c) => c._id));
    const merged = [...coverItems.filter((c) => !apiIds.has(c._id)), ...apiCreatives];
    setCreatives(merged);
    setLoading(false);
  }, [selectedDrama, activeTab, dramas, apiCreatives, t.coverImage]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
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
      <h1 className="text-2xl font-bold mb-6">{t.pageTitle}</h1>
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
              <option value="">{t.allDramas}</option>
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
                  {t.tabs[tab]}
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
                <p className="text-gray-500 text-sm">{t.noCreatives}</p>
                <p className="text-gray-600 text-xs mt-1">{selectedDrama ? t.noCreativesHintWithDrama : t.noCreativesHintNoDrama}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {creatives.map((c) => (
                  <div key={c._id} className="bg-[#1a1a2e] border border-gray-800/30 rounded-lg overflow-hidden group">
                    {/* Thumbnail */}
                    {c.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div
                        className="w-full aspect-[2/3]"
                        style={{ background: "linear-gradient(135deg, #6b21a8 0%, #312e81 50%, #0f172a 100%)" }}
                      />
                    )}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-200 truncate">{c.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {c.width}x{c.height} &middot; {c.fileSize}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleDownload(c.downloadUrl, `${c.title.replace(/\s+/g, "_")}.jpg`)}
                          className="flex-1 text-center text-xs font-medium py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                        >
                          {t.download}
                        </button>
                        <button className="flex-1 text-xs font-medium py-1.5 rounded-md border border-gray-700/50 text-gray-300 hover:bg-[#13131d] transition-colors">
                          {t.save}
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
            <h2 className="text-lg font-semibold mb-4">{t.deepLinkTitle}</h2>

            {/* Select Drama */}
            <label className="block text-sm text-gray-400 mb-1.5">{t.selectDrama}</label>
            <select
              value={linkDrama}
              onChange={(e) => setLinkDrama(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-200 mb-4 focus:outline-none focus:border-purple-500"
            >
              <option value="">{t.chooseDrama}</option>
              {dramas.map((d) => (
                <option key={d._id} value={d._id}>{d.title}</option>
              ))}
            </select>

            {/* Select Source */}
            <label className="block text-sm text-gray-400 mb-1.5">{t.selectSource}</label>
            <select
              value={linkSource}
              onChange={(e) => setLinkSource(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-200 mb-4 focus:outline-none focus:border-purple-500"
            >
              <option value="">{t.chooseSource}</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{t.sourceLabels[s]}</option>
              ))}
            </select>

            {/* Generated Link */}
            <label className="block text-sm text-gray-400 mb-1.5">{t.generatedLink}</label>
            <div className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 break-all min-h-[40px] mb-4">
              {generatedLink || <span className="text-gray-600">{t.linkPlaceholder}</span>}
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
              {copied ? t.copied : t.copyLink}
            </button>

            {/* Pro Tip */}
            <div className="mt-5 bg-purple-900/20 border border-purple-800/30 rounded-lg p-3.5">
              <p className="text-xs text-purple-300">
                <span className="font-semibold">{t.proTipTitle}</span> {t.proTipText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
