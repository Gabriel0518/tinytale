"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { contactApi } from "@/lib/api";

/* ─── Tab definitions ─── */
const TABS = ["About Us", "Privacy Policy", "Terms of Service", "FAQ"] as const;
type Tab = (typeof TABS)[number];

/* ─── Sidebar anchors per tab ─── */
const SIDEBAR_MAP: Record<Tab, { id: string; label: string }[]> = {
  "About Us": [
    { id: "mission", label: "Our Mission" },
    { id: "story", label: "Our Story" },
    { id: "stats", label: "By the Numbers" },
    { id: "team", label: "Leadership" },
  ],
  "Privacy Policy": [
    { id: "pp-intro", label: "Introduction" },
    { id: "pp-collect", label: "Information We Collect" },
    { id: "pp-use", label: "How We Use Data" },
    { id: "pp-share", label: "Data Sharing" },
    { id: "pp-security", label: "Security" },
    { id: "pp-rights", label: "Your Rights" },
  ],
  "Terms of Service": [
    { id: "tos-intro", label: "Introduction" },
    { id: "tos-account", label: "Account Terms" },
    { id: "tos-content", label: "Content & Licensing" },
    { id: "tos-coins", label: "Virtual Currency" },
    { id: "tos-conduct", label: "User Conduct" },
    { id: "tos-termination", label: "Termination" },
  ],
  FAQ: [
    { id: "faq-account", label: "Account & Login" },
    { id: "faq-coins", label: "Coins & Payment" },
    { id: "faq-content", label: "Watching & Content" },
    { id: "faq-vip", label: "VIP Membership" },
  ],
};

/* ─── Stats data ─── */
const STATS = [
  { value: "10M+", label: "Global Users" },
  { value: "500+", label: "Original Dramas" },
  { value: "45+", label: "Countries" },
  { value: "2B+", label: "Hours Watched" },
];

/* ─── Team data ─── */
const TEAM = [
  { name: "Sarah Chen", role: "CEO & Co-Founder", img: "https://picsum.photos/seed/team1/200/200" },
  { name: "Marcus Liu", role: "CTO", img: "https://picsum.photos/seed/team2/200/200" },
  { name: "Emily Park", role: "VP of Content", img: "https://picsum.photos/seed/team3/200/200" },
  { name: "David Kim", role: "Head of Design", img: "https://picsum.photos/seed/team4/200/200" },
];

/* ─── FAQ data ─── */
const FAQ_SECTIONS = [
  {
    id: "faq-account",
    title: "Account & Login",
    items: [
      { q: "How do I create an account?", a: "Tap 'Sign Up' on the login page. You can register with your email or use Google/Apple sign-in for quick access." },
      { q: "I forgot my password. How do I reset it?", a: "Go to the login page and tap 'Forgot password?'. Enter your email and we'll send you a verification code to reset your password." },
      { q: "How do I delete my account?", a: "Go to Settings > Delete Account. Please note this action is irreversible and all your data will be permanently removed." },
    ],
  },
  {
    id: "faq-coins",
    title: "Coins & Payment",
    items: [
      { q: "What are coins and how do they work?", a: "Coins are the virtual currency used to unlock premium episodes. You can purchase coins through our recharge page. Different episodes may require different amounts of coins." },
      { q: "How do I recharge coins?", a: "Go to your profile > Coins, or visit the Recharge page. Select a coin package and complete the payment through Stripe." },
      { q: "Can I get a refund?", a: "Refunds are available within 7 days of purchase for unused coins. Contact our support team for assistance." },
    ],
  },
  {
    id: "faq-content",
    title: "Watching & Content",
    items: [
      { q: "Are all episodes free?", a: "The first few episodes of each drama are free. Subsequent episodes require coins to unlock. VIP members get unlimited access to all content." },
      { q: "Can I download episodes for offline viewing?", a: "Offline viewing is available for VIP subscribers. Look for the download icon on the episode page." },
      { q: "How do I report a problem with a video?", a: "Use the report button on the video player page, or contact us through the support form below." },
    ],
  },
  {
    id: "faq-vip",
    title: "VIP Membership",
    items: [
      { q: "What benefits does VIP include?", a: "VIP members enjoy unlimited access to all dramas, ad-free experience, 4K streaming, early access to new releases, offline downloads, and 500 bonus coins per month." },
      { q: "How do I cancel my subscription?", a: "Go to Settings > Subscription and click 'Cancel Subscription'. Your access continues until the end of the billing period." },
      { q: "Can I switch between monthly and annual plans?", a: "Yes! Go to Settings > Subscription and select 'Change Plan'. The price difference will be prorated." },
    ],
  },
];

/* ─── Section divider component ─── */
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#FFD700] to-[#B8860B]" />
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
  );
}

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<Tab>("About Us");
  const [activeAnchor, setActiveAnchor] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "", type: "general" });
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const contentRef = useRef<HTMLDivElement>(null);

  /* Intersection Observer for sidebar active state */
  useEffect(() => {
    const anchors = SIDEBAR_MAP[activeTab];
    if (!anchors?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveAnchor(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.1 }
    );
    anchors.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [activeTab]);

  /* Reset anchor on tab change */
  useEffect(() => {
    const first = SIDEBAR_MAP[activeTab]?.[0];
    if (first) setActiveAnchor(first.id);
  }, [activeTab]);

  /* Auto-reset form status after 5 seconds */
  useEffect(() => {
    if (formStatus === "sent" || formStatus === "error") {
      const timer = setTimeout(() => setFormStatus("idle"), 5000);
      return () => clearTimeout(timer);
    }
  }, [formStatus]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");
    try {
      await contactApi.submitInquiry(formData);
      setFormStatus("sent");
      setFormData({ name: "", email: "", subject: "", message: "", type: "general" });
    } catch {
      setFormStatus("error");
    }
  }, [formData]);

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a00]/80 via-black/60 to-black" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://picsum.photos/seed/helpbg/1920/600')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gold-text">Information & Help Center</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Everything you need to know about TinyTale. Our mission, policies, and answers to your questions.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-16 z-30 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex overflow-x-auto scrollbar-hide gap-1" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                className={`whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab
                    ? "border-[#FFD700] text-[#FFD700]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex gap-10">
          {/* Sticky Sidebar - Desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-36 space-y-1">
              {SIDEBAR_MAP[activeTab].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToAnchor(id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    activeAnchor === id
                      ? "bg-[#FFD700]/10 text-[#FFD700] font-medium"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Sidebar - Mobile horizontal scroll */}
          <div className="lg:hidden -mx-6 px-6 mb-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2">
              {SIDEBAR_MAP[activeTab].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToAnchor(id)}
                  className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-all ${
                    activeAnchor === id
                      ? "bg-[#FFD700]/10 text-[#FFD700] font-medium"
                      : "text-zinc-500 hover:text-zinc-300 bg-zinc-900/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div ref={contentRef} className="flex-1 min-w-0">
            {activeTab === "About Us" && <AboutSection />}
            {activeTab === "Privacy Policy" && <PrivacySection />}
            {activeTab === "Terms of Service" && <TermsSection />}
            {activeTab === "FAQ" && <FaqSection openFaq={openFaq} setOpenFaq={setOpenFaq} />}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="border-t border-white/10 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <SectionDivider title="Contact Us" />
            <p className="text-zinc-400 mt-2">Have a question or feedback? We&apos;d love to hear from you.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Email Support</p>
                  <p className="text-sm text-zinc-400">support@tinytale.com</p>
                  <p className="text-xs text-zinc-500 mt-1">Response within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Live Chat</p>
                  <p className="text-sm text-zinc-400">Available 9 AM – 9 PM EST</p>
                  <p className="text-xs text-zinc-500 mt-1">Average wait time: 2 minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Headquarters</p>
                  <p className="text-sm text-zinc-400">San Francisco, California</p>
                  <p className="text-xs text-zinc-500 mt-1">With offices in LA, Seoul & Singapore</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                {["general", "technical", "business"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.type === t
                        ? "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40"
                        : "bg-zinc-900 text-zinc-400 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  aria-label="Your Name"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FFD700]/50 transition"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  aria-label="Email Address"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FFD700]/50 transition"
                />
              </div>
              <input
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                aria-label="Subject"
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FFD700]/50 transition"
              />
              <textarea
                placeholder="Your message..."
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                aria-label="Your message"
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FFD700]/50 transition resize-none"
              />
              <button
                type="submit"
                disabled={formStatus === "sending"}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#B8860B] text-black font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {formStatus === "sending" ? "Sending..." : formStatus === "sent" ? "Sent Successfully!" : "Send Message"}
              </button>
              {formStatus === "error" && <p role="alert" className="text-red-400 text-sm text-center">Failed to send. Please try again.</p>}
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   About Us Section
   ═══════════════════════════════════════════════════════════════ */
function AboutSection() {
  return (
    <div className="space-y-16">
      {/* Mission */}
      <section id="mission" className="scroll-mt-28">
        <SectionDivider title="Our Mission" />
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('https://picsum.photos/seed/mission/800/400')", backgroundSize: "cover" }} />
          <div className="relative z-20 p-8 md:p-12 max-w-lg">
            <p className="text-lg text-zinc-300 leading-relaxed">
              At TinyTale, we believe everyone deserves access to captivating stories. Our mission is to bring the world&apos;s most compelling short dramas to audiences everywhere — breaking language barriers and redefining mobile entertainment.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section id="story" className="scroll-mt-28">
        <SectionDivider title="Our Story" />
        <div className="space-y-4 text-zinc-400 leading-relaxed">
          <p>Founded in 2023 in San Francisco, TinyTale started with a simple observation: people love great stories, but don&apos;t always have time for hour-long episodes. We set out to create a platform dedicated to short-form drama — stories that are just as rich, emotional, and addictive, but designed for the way people actually consume content today.</p>
          <p>What began as a small team of storytellers and engineers has grown into a global platform serving millions of viewers across 45+ countries. We partner with top creators from Hollywood, Seoul, and beyond to produce original content that pushes the boundaries of short-form storytelling.</p>
          <p>Today, TinyTale is the leading destination for premium short dramas, with over 500 original titles spanning romance, fantasy, thriller, and more. And we&apos;re just getting started.</p>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="scroll-mt-28">
        <SectionDivider title="By the Numbers" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="p-6 rounded-xl bg-zinc-900/60 border border-[#333] hover:border-[#FFD700]/50 transition-colors text-center group">
              <p className="text-3xl font-bold text-[#FFD700] group-hover:scale-105 transition-transform">{s.value}</p>
              <p className="text-sm text-zinc-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section id="team" className="scroll-mt-28">
        <SectionDivider title="Leadership" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TEAM.map((m) => (
            <div key={m.name} className="text-center group">
              <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-zinc-800">
                <Image src={m.img} alt={m.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <p className="text-sm font-semibold text-white">{m.name}</p>
              <p className="text-xs text-zinc-500">{m.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Privacy Policy Section
   ═══════════════════════════════════════════════════════════════ */
function PrivacySection() {
  const sectionClass = "scroll-mt-28 space-y-3";
  const pClass = "text-zinc-400 text-sm leading-relaxed";
  return (
    <div className="space-y-12">
      <p className="text-xs text-zinc-500">Last updated: January 15, 2026</p>

      <section id="pp-intro" className={sectionClass}>
        <SectionDivider title="Introduction" />
        <p className={pClass}>This Privacy Policy describes how TinyTale Inc. (&quot;TinyTale&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and shares information about you when you use our website, mobile applications, and other online products and services (collectively, the &quot;Services&quot;).</p>
      </section>

      <section id="pp-collect" className={sectionClass}>
        <SectionDivider title="Information We Collect" />
        <p className={pClass}>We collect information you provide directly, such as when you create an account, make a purchase, or contact us. This includes your name, email address, payment information, and viewing preferences.</p>
        <p className={pClass}>We also automatically collect certain information when you use our Services, including your IP address, device type, browser type, operating system, referring URLs, and information about how you interact with our Services.</p>
      </section>

      <section id="pp-use" className={sectionClass}>
        <SectionDivider title="How We Use Data" />
        <p className={pClass}>We use the information we collect to provide, maintain, and improve our Services; process transactions and send related information; send you technical notices, updates, security alerts, and support messages; respond to your comments and questions; and personalize your experience.</p>
      </section>

      <section id="pp-share" className={sectionClass}>
        <SectionDivider title="Data Sharing" />
        <p className={pClass}>We do not sell your personal information. We may share information with service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, hosting services, and customer service. We may also share information when required by law or to protect our rights.</p>
      </section>

      <section id="pp-security" className={sectionClass}>
        <SectionDivider title="Security" />
        <p className={pClass}>We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. All payment transactions are encrypted using SSL technology, and we regularly audit our security practices.</p>
      </section>

      <section id="pp-rights" className={sectionClass}>
        <SectionDivider title="Your Rights" />
        <p className={pClass}>Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, delete, or port your data. You may also have the right to opt out of certain data processing activities. To exercise these rights, please contact us at privacy@tinytale.com.</p>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Terms of Service Section
   ═══════════════════════════════════════════════════════════════ */
function TermsSection() {
  const sectionClass = "scroll-mt-28 space-y-3";
  const pClass = "text-zinc-400 text-sm leading-relaxed";
  return (
    <div className="space-y-12">
      <p className="text-xs text-zinc-500">Last updated: January 15, 2026</p>

      <section id="tos-intro" className={sectionClass}>
        <SectionDivider title="Introduction" />
        <p className={pClass}>Welcome to TinyTale. These Terms of Service (&quot;Terms&quot;) govern your access to and use of our website, applications, and services. By accessing or using TinyTale, you agree to be bound by these Terms. If you do not agree, please do not use our Services.</p>
      </section>

      <section id="tos-account" className={sectionClass}>
        <SectionDivider title="Account Terms" />
        <p className={pClass}>You must be at least 13 years old to use TinyTale. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
      </section>

      <section id="tos-content" className={sectionClass}>
        <SectionDivider title="Content & Licensing" />
        <p className={pClass}>All content available on TinyTale, including but not limited to dramas, images, text, and graphics, is owned by TinyTale or its licensors and is protected by copyright and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access and view the content for personal, non-commercial use only.</p>
      </section>

      <section id="tos-coins" className={sectionClass}>
        <SectionDivider title="Virtual Currency" />
        <p className={pClass}>TinyTale Coins are a virtual currency that can be used to unlock premium content. Coins have no real-world monetary value and cannot be exchanged for cash. All coin purchases are final and non-refundable, except as required by applicable law. We reserve the right to modify coin pricing and availability at any time.</p>
      </section>

      <section id="tos-conduct" className={sectionClass}>
        <SectionDivider title="User Conduct" />
        <p className={pClass}>You agree not to use our Services for any unlawful purpose, to harass or harm other users, to distribute malware or spam, to attempt to gain unauthorized access to our systems, or to interfere with the proper functioning of our Services. Violation of these rules may result in account suspension or termination.</p>
      </section>

      <section id="tos-termination" className={sectionClass}>
        <SectionDivider title="Termination" />
        <p className={pClass}>We may terminate or suspend your account at any time for any reason, including violation of these Terms. Upon termination, your right to use the Services will immediately cease. Any unused coins in your account at the time of termination will be forfeited unless otherwise required by law.</p>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FAQ Section
   ═══════════════════════════════════════════════════════════════ */
function FaqSection({ openFaq, setOpenFaq }: { openFaq: string | null; setOpenFaq: (v: string | null) => void }) {
  return (
    <div className="space-y-12">
      {FAQ_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-28">
          <SectionDivider title={section.title} />
          <div className="space-y-2">
            {section.items.map((item, i) => {
              const key = `${section.id}-${i}`;
              const isOpen = openFaq === key;
              return (
                <div key={key} className="rounded-xl bg-zinc-900/60 border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : key)}
                    className="flex items-center w-full px-5 py-4 text-left gap-3"
                    aria-expanded={isOpen}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[#FFD700] shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className="text-sm text-white font-medium">{item.q}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pl-12">
                      <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
