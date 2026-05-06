const FASHION_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1469339942168-f4bdd57fad9c?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop",
];

export function createRandomImagePool(count: number, _bucket?: string): string[] {
  const shuffled = [...FASHION_IMAGES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
