import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search for short dramas, actors, and genres on TinyTale.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
