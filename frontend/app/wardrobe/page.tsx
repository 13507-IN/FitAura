"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Closet, Plus, Trash2, Shirt, Footprints, Glasses, CloudDrizzle } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Spotlight } from "@/components/aceternity/spotlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionReveal } from "@/components/visual/section-reveal";
import { loadWardrobe, removeWardrobeItem, saveWardrobeItem } from "@/lib/storage";
import type { WardrobeCategory, WardrobeItem, ClothingGender } from "@/types";

const CATEGORIES: { value: WardrobeCategory; label: string; icon: React.ReactNode }[] = [
  { value: "tops", label: "Tops", icon: <Shirt size={16} /> },
  { value: "bottoms", label: "Bottoms", icon: <Shirt size={16} /> },
  { value: "footwear", label: "Footwear", icon: <Footprints size={16} /> },
  { value: "accessories", label: "Accessories", icon: <Glasses size={16} /> },
  { value: "outerwear", label: "Outerwear", icon: <CloudDrizzle size={16} /> },
];

const GENDERS: { value: ClothingGender; label: string }[] = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "unisex", label: "Unisex" },
];

function generateId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function WardrobePage(): JSX.Element {
  const router = useRouter();
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<WardrobeCategory | "">("");
  const [form, setForm] = useState({
    name: "",
    category: "tops" as WardrobeCategory,
    color: "#000000",
    colors: [] as string[],
    brand: "",
    gender: "women" as ClothingGender,
    occasion: "",
    styleVibe: "",
  });

  useEffect(() => {
    setWardrobe(loadWardrobe());
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      category: "tops",
      color: "#000000",
      colors: [],
      brand: "",
      gender: "women",
      occasion: "",
      styleVibe: "",
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (item: WardrobeItem) => {
    setForm({
      name: item.name,
      category: item.category,
      color: item.color,
      colors: item.colors,
      brand: item.brand || "",
      gender: item.gender,
      occasion: item.occasion || "",
      styleVibe: item.styleVibe || "",
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;

    const item: WardrobeItem = {
      id: editingItem?.id ?? generateId(),
      name: form.name.trim(),
      category: form.category,
      color: form.color,
      colors: form.colors.length > 0 ? form.colors : [form.color],
      brand: form.brand.trim() || undefined,
      gender: form.gender,
      occasion: form.occasion || undefined,
      styleVibe: form.styleVibe || undefined,
      addedAt: editingItem?.addedAt ?? new Date().toISOString(),
    };

    saveWardrobeItem(item);
    setWardrobe(loadWardrobe());
    resetForm();
  };

  const handleDelete = (id: string) => {
    removeWardrobeItem(id);
    setWardrobe(loadWardrobe());
  };

  const filteredWardrobe = filterCategory
    ? wardrobe.filter((item) => item.category === filterCategory)
    : wardrobe;

  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.value] = filteredWardrobe.filter((item) => item.category === cat.value);
      return acc;
    },
    {} as Record<string, WardrobeItem[]>
  );

  return (
    <main className="site-page">
      <section className="hero-shell hero-shell--wardrobe">
        <Spotlight className="spotlight--left" fill="30, 64, 175" />
        <Spotlight className="spotlight--right" fill="236, 72, 153" delay={0.2} />
        <BackgroundBeams />

        <div className="hero-copy">
          <Badge>My Wardrobe</Badge>
          <h1>Track your clothing items for smarter outfit recommendations.</h1>
          <p>
            Add items you already own. FitAura will prioritize your wardrobe when generating looks,
            so recommendations work with what you have.
          </p>
          <div className="hero-actions">
            <Button onClick={openAddForm} size="lg">
              <Plus size={16} />
              Add Item
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/upload">Generate Look</Link>
            </Button>
          </div>
        </div>
      </section>

      <SectionReveal>
        <div className="wardrobe-filters">
          <label className="field">
            <span>Filter by Category</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as WardrobeCategory | "")}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option value={cat.value} key={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </label>
          <span className="muted-line">{wardrobe.length} items total</span>
        </div>
      </SectionReveal>

      {showForm && (
        <SectionReveal>
          <Card>
            <CardHeader>
              <CardTitle>{editingItem ? "Edit Item" : "Add New Item"}</CardTitle>
              <CardDescription>
                Enter details about your clothing item.
              </CardDescription>
            </CardHeader>
            <CardContent className="wardrobe-form">
              <label className="field">
                <span>Item Name *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Blue Denim Jacket"
                />
              </label>

              <div className="form-grid">
                <label className="field">
                  <span>Category *</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as WardrobeCategory })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option value={cat.value} key={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Gender</span>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as ClothingGender })}
                  >
                    {GENDERS.map((g) => (
                      <option value={g.value} key={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Primary Color</span>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Brand</span>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g., Zara, H&M"
                  />
                </label>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Best Occasion (optional)</span>
                  <select
                    value={form.occasion}
                    onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="College">College</option>
                    <option value="Interview">Interview</option>
                    <option value="Date">Date</option>
                    <option value="Party">Party</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Casual Hangout">Casual Hangout</option>
                    <option value="Travel">Travel</option>
                  </select>
                </label>

                <label className="field">
                  <span>Style Vibe (optional)</span>
                  <select
                    value={form.styleVibe}
                    onChange={(e) => setForm({ ...form, styleVibe: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="Minimal">Minimal</option>
                    <option value="Streetwear">Streetwear</option>
                    <option value="Classy">Classy</option>
                    <option value="Ethnic">Ethnic</option>
                    <option value="Sporty">Sporty</option>
                  </select>
                </label>
              </div>

              <div className="below-card-actions">
                <Button onClick={handleSave} disabled={!form.name.trim()}>
                  {editingItem ? "Update Item" : "Add to Wardrobe"}
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </SectionReveal>
      )}

      <SectionReveal>
        {wardrobe.length === 0 ? (
          <Card className="empty-shell">
            <CardHeader>
              <CardTitle>Your wardrobe is empty</CardTitle>
              <CardDescription>
                Add items you own to get personalized recommendations that work with your existing clothes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={openAddForm} size="lg">
                <Plus size={16} />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="wardrobe-grid">
            {CATEGORIES.map((cat) => {
              const items = grouped[cat.value];
              if (items.length === 0) return null;

              return (
                <Card key={cat.value}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {cat.icon}
                      {cat.label} ({items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="wardrobe-list">
                    {items.map((item) => (
                      <div key={item.id} className="wardrobe-item">
                        <div
                          className="wardrobe-swatch"
                          style={{ backgroundColor: item.color }}
                          title={item.color}
                        />
                        <div className="wardrobe-item__info">
                          <strong>{item.name}</strong>
                          <span>
                            {item.brand && `${item.brand} · `}
                            {item.gender}
                            {item.occasion && ` · ${item.occasion}`}
                          </span>
                        </div>
                        <div className="wardrobe-item__actions">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </SectionReveal>
    </main>
  );
}
