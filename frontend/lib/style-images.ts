function randomSeed(): number {
  return Math.floor(Math.random() * 100_000);
}

export function createRandomImagePool(count: number, bucket: string): string[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = randomSeed();
    const width = 760 + ((index * 37) % 180);
    const height = 980 + ((index * 53) % 220);
    return `https://picsum.photos/seed/${bucket}-${seed}-${index}/${width}/${height}`;
  });
}
