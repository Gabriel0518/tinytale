import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rankings",
  description:
    "See the most popular, trending, and top-rated short dramas on TinyTale.",
};

export default function RankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
