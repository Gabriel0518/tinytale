"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/features/Navbar";
import { ChevronDown, ChevronRight, Mail, MessageCircle, Shield, FileText, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

const faqSections: { title: string; icon: React.ReactNode; items: FaqItem[] }[] = [
  {
    title: "Account & Login",
    icon: <Shield size={20} />,
    items: [
      { question: "How do I create an account?", answer: "Tap 'Sign Up' on the login page. You can register with your email or use Google/Apple sign-in for quick access." },
      { question: "I forgot my password. How do I reset it?", answer: "Go to the login page and tap 'Forgot password?'. Enter your email and we'll send you a verification code to reset your password." },
      { question: "How do I delete my account?", answer: "Go to Settings > Delete Account. Please note this action is irreversible and all your data will be permanently removed." },
    ],
  },
  {
    title: "Coins & Payment",
    icon: <HelpCircle size={20} />,
    items: [
      { question: "What are coins and how do they work?", answer: "Coins are the virtual currency used to unlock premium episodes. You can purchase coins through our recharge page. Different episodes may require different amounts of coins." },
      { question: "How do I recharge coins?", answer: "Go to your profile > Coins, or visit the Recharge page. Select a coin package and complete the payment through Stripe." },
      { question: "Can I get a refund?", answer: "Refunds are available within 7 days of purchase for unused coins. Contact our support team for assistance." },
    ],
  },
  {
    title: "Watching & Content",
    icon: <FileText size={20} />,
    items: [
      { question: "Are all episodes free?", answer: "The first few episodes of each drama are free. Subsequent episodes require coins to unlock. VIP members get unlimited access to all content." },
      { question: "Can I download episodes for offline viewing?", answer: "Offline viewing is available for VIP subscribers. Look for the download icon on the episode page." },
      { question: "How do I report a problem with a video?", answer: "Use the report button on the video player page, or contact us through the support channels below." },
    ],
  },
];

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<number>(0);
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (key: string) => {
    setOpenItem(openItem === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-20 pb-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Help Center</h1>
          <p className="mt-2 text-text-secondary">Find answers to common questions</p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-4">
          {faqSections.map((section, si) => (
            <div key={si} className="rounded-xl bg-bg-secondary overflow-hidden">
              <button
                onClick={() => setOpenSection(openSection === si ? -1 : si)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="text-accent-primary">{section.icon}</div>
                <span className="flex-1 font-semibold text-white">{section.title}</span>
                <ChevronDown
                  size={18}
                  className={cn("text-text-tertiary transition-transform", openSection === si && "rotate-180")}
                />
              </button>
              {openSection === si && (
                <div className="border-t border-white/5 px-4 pb-4">
                  {section.items.map((item, ii) => {
                    const key = `${si}-${ii}`;
                    return (
                      <div key={key} className="border-b border-white/5 last:border-0">
                        <button
                          onClick={() => toggleItem(key)}
                          className="flex w-full items-center gap-2 py-3 text-left"
                        >
                          <ChevronRight
                            size={14}
                            className={cn("text-text-tertiary transition-transform", openItem === key && "rotate-90")}
                          />
                          <span className="text-sm text-text-secondary hover:text-white transition-colors">
                            {item.question}
                          </span>
                        </button>
                        {openItem === key && (
                          <p className="pb-3 pl-6 text-sm text-text-tertiary leading-relaxed">
                            {item.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-8 rounded-xl bg-bg-secondary p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-white">Still need help?</h2>
          <p className="mb-4 text-sm text-text-secondary">Our support team is here for you</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="mailto:support@tinytale.com"
              className="flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <Mail size={16} />
              Email Support
            </a>
            <button className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-bg-elevated px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
              <MessageCircle size={16} />
              Live Chat
            </button>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-8 flex justify-center gap-6 text-xs text-text-tertiary">
          <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
        </div>
      </main>
    </div>
  );
}
