import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Get help with TinyTale. Find answers to FAQs, read our privacy policy, terms of service, and contact support.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
