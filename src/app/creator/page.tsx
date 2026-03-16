"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  ChartColumnBig,
  CircleDollarSign,
  Clapperboard,
  FileBadge,
  Globe2,
  Landmark,
  MessageSquareMore,
  Search,
  ShieldCheck,
  Sparkles,
  Stars,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";

const stats = [
  {
    label: "UP TO 60%",
    value: "Revenue share",
    description: "For top-tier creators publishing high-performing drama catalogs.",
  },
  {
    label: "48 HOURS",
    value: "Review turnaround",
    description: "Most creator applications are reviewed within two business days.",
  },
  {
    label: "$0 UPFRONT",
    value: "No fees, ever",
    description: "No deposits, onboarding costs, or hidden platform charges.",
  },
  {
    label: "MONTHLY",
    value: "USD payouts",
    description: "Settle earnings to your verified bank account every month.",
  },
];

const heroSignals = [
  {
    title: "Dedicated drama audience",
    description: "TinyTale viewers open the platform to binge vertical series, not to scroll past unrelated content.",
  },
  {
    title: "Built-in creator operations",
    description: "Upload episodes, manage subtitles, watch analytics, and handle settlements without third-party tools.",
  },
  {
    title: "Predictable monthly payouts",
    description: "Coin unlock revenue settles in USD with transparent breakdowns and creator-side support tracking.",
  },
];

const whyTinyTale = [
  {
    title: "Viewers come here to watch dramas.",
    description:
      "No competing with dance videos or cooking clips. TinyTale users open the app specifically to binge short dramas.",
    icon: Users,
  },
  {
    title: "Earn from views, not donations.",
    description:
      "Our coin-based model ties revenue to episode unlocks, so your income scales with content quality and audience retention.",
    icon: CircleDollarSign,
  },
  {
    title: "A studio in your browser.",
    description:
      "Upload episodes, manage subtitles, track analytics, and follow settlements from one creator dashboard.",
    icon: BriefcaseBusiness,
  },
];

const earningPotential = [
  {
    tier: "Bronze",
    share: "30% share",
    scenario: "1 drama, 30 episodes, 5,000 monthly unlocks",
    estimate: "$300 - $500",
    label: "Great for getting started",
  },
  {
    tier: "Silver",
    share: "45% share",
    scenario: "3 dramas, 90 episodes, 25,000 monthly unlocks",
    estimate: "$2,000 - $4,000",
    label: "Consistent catalog builders",
  },
  {
    tier: "Gold",
    share: "60% share",
    scenario: "5+ dramas, 200+ episodes, 100,000+ monthly unlocks",
    estimate: "$10,000+",
    label: "Full-time creator income",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Submit your application",
    description:
      "Tell us about your creative background and what kind of stories you want to tell. Most applications are reviewed within 48 hours.",
    icon: FileBadge,
  },
  {
    step: "02",
    title: "Upload your first drama",
    description:
      "Use the creator workspace to upload episodes, add subtitles, set cover art, and submit every release for quality review.",
    icon: Clapperboard,
  },
  {
    step: "03",
    title: "Track your performance",
    description:
      "Follow views, watch time, revenue breakdown, and audience signals from one analytics workspace built for drama catalogs.",
    icon: ChartColumnBig,
  },
  {
    step: "04",
    title: "Get paid monthly",
    description:
      "Verify your bank account, reach the $50 threshold, and receive USD payouts without invoices or manual follow-up.",
    icon: Landmark,
  },
];

const platformFeatures = [
  {
    title: "One dashboard. Everything you need.",
    description:
      "Manage dramas, episodes, subtitles, and cover art from a single workspace with bulk uploads and instant previews.",
    icon: Sparkles,
  },
  {
    title: "Know your audience inside out.",
    description:
      "Track views, watch time, geography, device mix, and per-episode performance to see what stories resonate.",
    icon: ChartColumnBig,
  },
  {
    title: "See every dollar. No hidden fees.",
    description:
      "Monthly settlement statements break down gross revenue, platform fees, your share, and payout status in USD.",
    icon: CircleDollarSign,
  },
  {
    title: "Quality standards that protect your brand.",
    description:
      "Every submission goes through content review for quality, compliance, and viewer readiness, with actionable feedback.",
    icon: ShieldCheck,
  },
  {
    title: "Reach viewers worldwide.",
    description:
      "Upload SRT or VTT subtitle files in any language and let the platform serve the right subtitles automatically.",
    icon: Globe2,
  },
  {
    title: "Help when you need it.",
    description:
      "Open creator support tickets for settlement questions, content review clarifications, and dashboard issues.",
    icon: MessageSquareMore,
  },
];

const creatorTiers = [
  {
    name: "Bronze",
    share: "30%",
    requirements: "Approved creator account",
    perks: "Creator workspace, basic analytics, monthly settlements",
  },
  {
    name: "Silver",
    share: "45%",
    requirements: "3+ published dramas, consistent upload cadence",
    perks: "Advanced analytics, priority review, dedicated support",
  },
  {
    name: "Gold",
    share: "60%",
    requirements: "5+ published dramas, strong audience metrics",
    perks: "Maximum revenue share, featured placement, early tool access",
  },
];

const testimonials = [
  {
    quote:
      '"I uploaded my first drama series on TinyTale and hit $1,200 in my second month. The dashboard makes it easy to see exactly where my money comes from."',
    name: "Sarah M.",
    role: "Independent Creator",
    location: "Los Angeles, CA",
  },
  {
    quote:
      '"Coming from YouTube Shorts, I was skeptical about a paywall model. But TinyTale viewers actually pay for quality content. My per-viewer revenue is 10x what I made on ads."',
    name: "James K.",
    role: "Studio Producer",
    location: "Toronto, Canada",
  },
  {
    quote:
      '"The 48-hour review is real. I submitted on Monday, got approved on Tuesday, and had my first episode live by Wednesday."',
    name: "Maria L.",
    role: "Screenwriter & Director",
    location: "Miami, FL",
  },
];

const faqs = [
  {
    question: "Who can apply to be a TinyTale creator?",
    answer:
      "Anyone creating short-form vertical dramas. Independent filmmakers, screenwriters, directors, and production studios are all eligible if the portfolio fits our drama format.",
  },
  {
    question: "Do I need a minimum number of followers to apply?",
    answer:
      "No. We review your portfolio and content quality, not your social media following.",
  },
  {
    question: "How long does the application review take?",
    answer:
      "Most applications are reviewed within 48 hours. You will receive an email update and can also track status inside the creator flow.",
  },
  {
    question: "When and how do I get paid?",
    answer:
      "Earnings are settled monthly in USD. Once your available balance reaches $50, you can request payout to your verified bank account. Payouts are typically processed within 5-7 business days.",
  },
  {
    question: "What kind of content is accepted?",
    answer:
      "We accept episodic vertical short dramas, usually under 3 minutes per episode. Every title must pass review for production quality, narrative coherence, subtitle quality, compliance, and viewer readiness.",
  },
  {
    question: "Can I publish the same content on other platforms?",
    answer:
      "That depends on your creator agreement. TinyTale supports both exclusive and non-exclusive arrangements, and exclusive content may qualify for stronger revenue-share tiers.",
  },
  {
    question: "Is there a cost to join?",
    answer:
      "No. There are no application fees, platform fees, or hidden charges. TinyTale earns through revenue sharing on viewer purchases.",
  },
];

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1877F2]">{eyebrow}</p>
      <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-[#0f172a] md:text-[34px]">{title}</h2>
      {description ? <p className="mt-3 text-[15px] leading-7 text-[#64748b]">{description}</p> : null}
    </div>
  );
}

export default function CreatorLandingPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const displayName = user?.nickname?.trim() || user?.email?.split("@")[0] || "Creator";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "CR";

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-[#0f172a]">
      <header className="sticky top-0 z-10 border-b border-[#e2e8f0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-4 py-3 md:px-8 xl:px-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-block size-4 rotate-45 rounded-[3px] bg-[#1877F2]" />
              <span className="text-xl font-bold tracking-tight">TinyTale</span>
            </div>
            <label className="hidden min-w-[280px] items-center gap-2 rounded-lg bg-[#f1f5f9] px-3 py-2 text-sm text-[#64748b] lg:flex">
              <Search className="size-4" />
              <input
                aria-label="Search creator docs and onboarding"
                className="w-full bg-transparent outline-none placeholder:text-[#94a3b8]"
                placeholder="Search creator guides, payout rules, review standards..."
                type="text"
              />
            </label>
          </div>

          <div className="flex items-center gap-5">
            <LanguageSwitcher />
            <button
              aria-label="Notifications"
              className="rounded-md p-1 text-[#334155] transition hover:bg-[#f1f5f9]"
              type="button"
            >
              <Bell className="size-5" />
            </button>
            <div className="hidden h-10 items-center gap-3 border-l border-[#e2e8f0] pl-4 sm:flex">
              <div className="text-right leading-tight">
                <p className="text-sm font-bold text-[#0f172a]">{displayName}</p>
                <p className="text-xs text-[#64748b]">Creator Applicant</p>
              </div>
              <Link href={localizePath("/user/profile", locale)} className="size-10 rounded-full">
                <div className="size-10 rounded-full bg-gradient-to-br from-[#9ca3af] to-[#64748b] p-0.5">
                  {user?.avatar ? (
                    <Image alt={displayName} className="size-full rounded-full object-cover" height={40} src={user.avatar} width={40} />
                  ) : (
                    <div className="flex size-full items-center justify-center rounded-full bg-white text-xs font-semibold text-[#334155]">{initials}</div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 pb-16 pt-6 md:px-6 xl:px-0">
        <section className="relative overflow-hidden rounded-[32px] border border-[#dbe2ea] bg-[#0f172a] px-5 py-8 text-white md:px-8 md:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.26),_transparent_42%),radial-gradient(circle_at_80%_20%,_rgba(236,72,153,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.18),_transparent_38%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)] lg:items-stretch">
            <div className="flex flex-col justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#93c5fd]">Now Accepting Creators</p>
              <h1 className="mt-4 max-w-[760px] text-[38px] font-black leading-[0.96] tracking-[-0.05em] sm:text-[46px] md:text-[54px] lg:text-[58px] xl:text-[64px]">
                Your stories deserve an audience and a paycheck.
              </h1>
              <p className="mt-5 max-w-[760px] text-[15px] leading-7 text-[#cbd5e1] md:text-[17px]">
                TinyTale is the premium short drama platform where creators earn up to 60% revenue share in USD. No follower minimums. No algorithm lottery. Just great stories, real viewers, and monthly payouts.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-6 py-3 text-[14px] font-bold shadow-[0_12px_30px_rgba(24,119,242,0.35)] transition hover:bg-[#166fe5]"
                  href={localizePath("/creator/apply", locale)}
                >
                  Apply to Create
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-[14px] font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
                  href="#how-it-works"
                >
                  See How It Works
                </a>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#cbd5e1] md:text-sm">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">No credit card required</span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">48-hour review</span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">Monthly USD settlements</span>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {heroSignals.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] px-4 py-4 backdrop-blur-sm"
                  >
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="mt-2 text-[13px] leading-6 text-[#cbd5e1]">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((item) => (
                <article key={item.label} className="flex h-full min-h-[182px] flex-col rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">{item.label}</p>
                  <p className="mt-3 text-[24px] font-black leading-none text-white">{item.value}</p>
                  <p className="mt-3 text-sm leading-6 text-[#cbd5e1]">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:px-7 md:py-7">
          <SectionIntro
            eyebrow="Why TinyTale"
            title="Built for creators who take storytelling seriously."
            description="We're not another social media app. TinyTale is a dedicated short drama streaming platform built for episodic vertical series and creators who want both audience attention and real revenue."
          />
          <div className="mt-6 grid items-stretch gap-4 md:grid-cols-3">
            {whyTinyTale.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="flex h-full flex-col rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
              >
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#e0efff] text-[#1877F2]">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-[18px] font-bold tracking-[-0.02em] text-[#0f172a]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:px-7 md:py-7">
          <SectionIntro
            eyebrow="Earning Potential"
            title="How much can you really earn?"
            description="Your revenue depends on content quality, episode count, and audience engagement. These scenarios reflect the current tier model and typical unlock behavior across short drama catalogs."
          />
          <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-3">
            {earningPotential.map((item) => (
              <article key={item.tier} className="flex h-full flex-col rounded-[24px] border border-[#dbe2ea] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1877F2]">{item.tier}</p>
                    <p className="mt-2 text-[18px] font-bold text-[#0f172a]">{item.share}</p>
                  </div>
                  <span className="rounded-full bg-[#e0efff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">{item.label}</span>
                </div>
                <p className="mt-4 text-sm font-semibold text-[#0f172a]">{item.scenario}</p>
                <p className="mt-auto pt-5 text-[34px] font-black tracking-[-0.04em] text-[#0f172a]">{item.estimate}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs leading-6 text-[#64748b]">
            Estimates are based on average coin-to-USD conversion and typical viewer purchasing behavior. Actual earnings vary by content performance, retention, and regional pricing.
          </p>
        </section>

        <section id="how-it-works" className="rounded-[28px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:px-7 md:py-7">
          <SectionIntro eyebrow="How It Works" title="From idea to income in 4 steps." />
          <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-4">
            {workflowSteps.map(({ step, title, description, icon: Icon }) => (
              <article key={step} className="flex h-full flex-col rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1877F2]">Step {step}</span>
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#1877F2] shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
                    <Icon className="size-5" />
                  </div>
                </div>
                <h3 className="mt-4 text-[18px] font-bold tracking-[-0.02em] text-[#0f172a]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:px-7 md:py-7">
          <SectionIntro
            eyebrow="Platform Features"
            title="Everything you need to build and grow."
            description="The creator center now covers content operations, analytics, settlements, multilingual delivery, and support workflows without pushing you into external tools."
          />
          <div className="mt-6 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platformFeatures.map(({ title, description, icon: Icon }) => (
              <article key={title} className="flex h-full flex-col rounded-[24px] border border-[#e2e8f0] bg-[#ffffff] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#1877F2]">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-[18px] font-bold tracking-[-0.02em] text-[#0f172a]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:px-7 md:py-7">
          <SectionIntro
            eyebrow="Creator Tiers"
            title="The more you create, the more you earn."
            description="Revenue share grows with your catalog and audience performance. Every creator starts at Bronze and levels up based on published work and business results."
          />
          <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-3">
            {creatorTiers.map((tier, index) => (
              <article
                key={tier.name}
                className={`flex h-full flex-col rounded-[24px] border p-5 ${index === 1 ? "border-[#bfd8ff] bg-[#f5f9ff]" : "border-[#e2e8f0] bg-[#f8fafc]"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[20px] font-black tracking-[-0.03em] text-[#0f172a]">{tier.name}</p>
                    <p className="mt-1 text-sm text-[#64748b]">Revenue share</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-2 text-right shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                    <p className="text-[24px] font-black leading-none text-[#1877F2]">{tier.share}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4 text-sm leading-6 text-[#475569]">
                  <div>
                    <p className="font-semibold text-[#0f172a]">Requirements</p>
                    <p className="mt-1">{tier.requirements}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f172a]">Perks</p>
                    <p className="mt-1">{tier.perks}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:px-7 md:py-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <SectionIntro
              eyebrow="Creator Spotlight"
              title="Hear from creators who are already earning."
              description="This section uses placeholder testimonials from the copy spec and should be replaced with verified creator quotes before public launch."
            />
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-semibold text-[#c2410c]">
              <Stars className="size-3.5" />
              Simulated copy for illustration purposes
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
                <p className="text-sm leading-7 text-[#334155]">{item.quote}</p>
                <div className="mt-5 border-t border-[#e2e8f0] pt-4">
                  <p className="text-sm font-bold text-[#0f172a]">{item.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#64748b]">{item.role}</p>
                  <p className="mt-1 text-xs text-[#94a3b8]">{item.location}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:px-7 md:py-7">
          <SectionIntro eyebrow="FAQ" title="Answers before you apply." />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {faqs.map((item) => (
              <details key={item.question} className="group rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-5 open:bg-white">
                <summary className="cursor-pointer list-none text-[16px] font-bold text-[#0f172a]">
                  <span className="inline-flex items-start gap-3">
                    <span className="mt-1 size-2 rounded-full bg-[#1877F2]" />
                    <span>{item.question}</span>
                  </span>
                </summary>
                <p className="mt-3 pl-5 text-sm leading-6 text-[#64748b]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-[#dbe2ea] bg-[linear-gradient(135deg,#0f172a_0%,#16233b_55%,#1d4ed8_140%)] px-5 py-8 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] md:px-8 md:py-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#93c5fd]">Final CTA</p>
              <h2 className="mt-3 text-[30px] font-black tracking-[-0.04em] text-white md:text-[38px]">We&apos;re actively recruiting creators.</h2>
              <p className="mt-3 text-[15px] leading-7 text-[#dbeafe] md:text-[16px]">
                Spots in the creator program are reviewed on a rolling basis. The sooner you apply, the sooner your stories reach a growing audience of drama fans.
              </p>
              <p className="mt-4 text-xs text-[#bfdbfe]">No credit card required. 48-hour review. Cancel anytime.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-bold text-[#0f172a] transition hover:bg-[#f8fafc]"
                href={localizePath("/creator/apply", locale)}
              >
                Apply Now - It&apos;s Free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-[14px] font-bold text-white transition hover:bg-white/15"
                href={localizePath("/creator/dashboard", locale)}
              >
                Open Creator Center
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
