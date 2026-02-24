"use client";

import { useMemo } from "react";
import { createRandomImagePool } from "@/lib/style-images";

interface ImageMosaicProps {
  bucket: string;
  count?: number;
  className?: string;
  labelPrefix?: string;
}

export function ImageMosaic({
  bucket,
  count = 10,
  className = "",
  labelPrefix = "Style"
}: ImageMosaicProps): JSX.Element {
  const images = useMemo(() => createRandomImagePool(count, bucket), [count, bucket]);

  return (
    <div className={`mosaic ${className}`}>
      {images.map((src, index) => (
        <figure key={src} className="mosaic-tile">
          <img src={src} alt={`${labelPrefix} inspiration ${index + 1}`} loading="lazy" />
          <figcaption>{`${labelPrefix} ${index + 1}`}</figcaption>
        </figure>
      ))}
    </div>
  );
}
