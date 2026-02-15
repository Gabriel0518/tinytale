"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/features/Navbar";
import { DramaCard } from "@/components/features/DramaCard";
import { mockDramas, mockCategories } from "@/lib/mockData";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [selectedCategory, setSelectedCategory] = useState(slug || "all");
  const [sortBy, setSortBy] = useState("newest");

  const currentCategory = mockCategories.find((c) => c.slug === selectedCategory);

  const filteredDramas = selectedCategory === "all"
    ? mockDramas
    : mockDramas.filter((d) => d.categories.some((c) => c.toLowerCase() === currentCategory?.name.toLowerCase()));

  const sortedDramas = [...filteredDramas].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="hidden w-48 flex-shrink-0 md:block">
              <h3 className="mb-4 text-sm font-semibold text-text-tertiary uppercase">Categories</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedCategory === "all"
                      ? "bg-accent-primary text-white"
                      : "text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  All Dramas
                </button>
                {mockCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      selectedCategory === category.slug
                        ? "bg-accent-primary text-white"
                        : "text-text-secondary hover:bg-bg-secondary"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-text-primary">
                  {currentCategory?.name || "All Dramas"}
                </h1>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-bg-elevated bg-bg-secondary px-3 py-2 text-sm text-text-primary"
                >
                  <option value="newest">Newest</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* Mobile Categories */}
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === "all"
                      ? "bg-accent-primary text-white"
                      : "bg-bg-secondary text-text-secondary"
                  }`}
                >
                  All
                </button>
                {mockCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedCategory === category.slug
                        ? "bg-accent-primary text-white"
                        : "bg-bg-secondary text-text-secondary"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Drama Grid */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {sortedDramas.map((drama) => (
                  <DramaCard key={drama.id} drama={drama} />
                ))}
              </div>

              {/* Empty State */}
              {sortedDramas.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-text-tertiary">No dramas found in this category</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
