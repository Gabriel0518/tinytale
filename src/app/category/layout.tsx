import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Explore drama categories on TinyTale. Find romance, fantasy, thriller, comedy, and more.",
};

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
