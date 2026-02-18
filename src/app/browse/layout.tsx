import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Dramas",
  description:
    "Browse and discover short dramas on TinyTale. Filter by genre, status, and rating to find your next binge.",
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
