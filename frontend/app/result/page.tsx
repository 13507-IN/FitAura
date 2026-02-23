"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { regenerateLook } from "@/lib/api";
import { loadLookResult, saveLookResult } from "@/lib/storage";
import type { StoredLookResult } from "@/types";

export default function ResultPage() {
  const [result, setResult] = useState<StoredLookResult | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setResult(loadLookResult());
  }, []);

  const handleRegenerate = async () => {
    if (!result) {
      return;
    }

    setError("");
    setIsRegenerating(true);

    try {
      const regenerated = await regenerateLook({
        occasion: result.occasion,
        styleVibe: result.styleVibe,
        basePalette: result.colorPalette
      });

      const updated: StoredLookResult = {
        ...regenerated,
        occasion: result.occasion,
        styleVibe: result.styleVibe,
        previewUrl: result.previewUrl
      };

      setResult(updated);
      saveLookResult(updated);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Unable to regenerate suggestions.";
      setError(message);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!result) {
    return (
      <main className="page">
        <section className="card">
          <h1>No style result yet</h1>
          <p className="subtitle">Upload an image first to generate personalized recommendations.</p>
          <Link href="/upload" className="button primary">
            Go To Upload
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page grid">
      <section className="hero">
        <p className="subtitle">
          Occasion: {result.occasion} | Vibe: {result.styleVibe}
        </p>
        <h1>Your FitAura Look</h1>
        <p>Here is the best style combo for your photo, event, and selected aesthetic.</p>
      </section>

      <section className="result-top">
        <article className="card">
          {result.previewUrl ? (
            <img className="preview" src={result.previewUrl} alt="Uploaded portrait preview" />
          ) : (
            <p className="subtitle">Image preview unavailable.</p>
          )}
        </article>

        <article className="card">
          <ul className="result-list">
            <li className="result-item">
              <strong>Top Wear</strong>
              {result.topWear}
            </li>
            <li className="result-item">
              <strong>Bottom Wear</strong>
              {result.bottomWear}
            </li>
            <li className="result-item">
              <strong>Footwear</strong>
              {result.footwear}
            </li>
            <li className="result-item">
              <strong>Accessories</strong>
              {result.accessories}
            </li>
            <li className="result-item">
              <strong>Hairstyle</strong>
              {result.hairstyle}
            </li>
          </ul>
        </article>
      </section>

      <section className="card grid">
        <div>
          <h3>Recommended Color Palette</h3>
          <div className="palette">
            {result.colorPalette.map((color) => (
              <div className="swatch" key={color}>
                <div className="swatch-color" style={{ backgroundColor: color }} />
                <div className="swatch-code">{color}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="result-item">
          <strong>Confidence Tip</strong>
          {result.confidenceTip}
        </div>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button className="button primary" type="button" onClick={handleRegenerate} disabled={isRegenerating}>
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </button>
          <Link href="/upload" className="button secondary">
            Try Another Photo
          </Link>
        </div>
      </section>
    </main>
  );
}
