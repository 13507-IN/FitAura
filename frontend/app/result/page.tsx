"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Brain, Camera, Check, Copy, RefreshCcw, Sparkles } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Spotlight } from "@/components/aceternity/spotlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageMosaic } from "@/components/visual/image-mosaic";
import { SectionReveal } from "@/components/visual/section-reveal";
import { regenerateLook } from "@/lib/api";
import { getColorNameFromHex } from "@/lib/color-name";
import { loadLookHistory, loadLookResult, saveLookResult } from "@/lib/storage";
import type { StoredLookResult } from "@/types";

function formatSavedTime(timestamp?: string): string {
  if (!timestamp) {
    return "Saved recently";
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "Saved recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(parsed);
}

function buildShareSummary(result: StoredLookResult): string {
  return [
    `FitAura Style Summary`,
    `Occasion: ${result.occasion}`,
    `Style vibe: ${result.styleVibe}`,
    `Top wear: ${result.topWear}`,
    `Bottom wear: ${result.bottomWear}`,
    `Footwear: ${result.footwear}`,
    `Accessories: ${result.accessories}`,
    `Hairstyle: ${result.hairstyle}`,
    `Palette: ${result.colorPalette.join(", ")}`,
    `Confidence tip: ${result.confidenceTip}`
  ].join("\n");
}

export default function ResultPage(): JSX.Element {
  const [result, setResult] = useState<StoredLookResult | null>(null);
  const [history, setHistory] = useState<StoredLookResult[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const paletteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setResult(loadLookResult());
    setHistory(loadLookHistory());
  }, []);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  useEffect(() => {
    if (!result) {
      return;
    }

    const context = gsap.context(() => {
      if (headlineRef.current) {
        gsap.fromTo(
          headlineRef.current,
          { y: 20, opacity: 0, filter: "blur(6px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power2.out" }
        );
      }

      if (paletteRef.current) {
        gsap.fromTo(
          paletteRef.current.children,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: "power2.out", delay: 0.12 }
        );
      }
    });

    return () => context.revert();
  }, [result]);

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
        previewUrl: result.previewUrl,
        createdAt: new Date().toISOString()
      };

      setResult(updated);
      saveLookResult(updated);
      setHistory(loadLookHistory());
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Unable to regenerate suggestions.";
      setError(message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const outfitItems = useMemo(
    () =>
      result
        ? [
            { label: "Top wear", value: result.topWear },
            { label: "Bottom wear", value: result.bottomWear },
            { label: "Footwear", value: result.footwear },
            { label: "Accessories", value: result.accessories },
            { label: "Hairstyle", value: result.hairstyle }
          ]
        : [],
    [result]
  );

  const paletteItems = useMemo(
    () =>
      result
        ? result.colorPalette.map((hex, index) => ({
            id: `${hex}-${index}`,
            hex,
            name: getColorNameFromHex(hex)
          }))
        : [],
    [result]
  );

  const shareSummary = useMemo(() => (result ? buildShareSummary(result) : ""), [result]);

  const copySummary = async () => {
    if (!shareSummary) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareSummary);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const openSavedSession = (session: StoredLookResult) => {
    setResult(session);
    saveLookResult(session);
    setHistory(loadLookHistory());
  };

  if (!result) {
    return (
      <main className="site-page">
        <section className="empty-shell">
          <Badge variant="secondary">No Result Found</Badge>
          <h1>Generate a look first to unlock your style report.</h1>
          <p>Upload a photo and FitAura will produce a complete outfit recommendation in one click.</p>
          <Button asChild size="lg">
            <Link href="/upload">Go To Upload</Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="site-page">
      <section className="hero-shell hero-shell--result">
        <Spotlight className="spotlight--left" fill="30, 64, 175" />
        <Spotlight className="spotlight--right" fill="21, 128, 61" delay={0.2} />
        <BackgroundBeams />

        <div className="hero-copy">
          <Badge>Styled Result</Badge>
          <h1 ref={headlineRef}>
            Your {result.occasion} look with a {result.styleVibe} vibe is ready.
          </h1>
          <p>
            Review the generated outfit stack, color direction, and confidence tip. Regenerate anytime for a fresh
            variation while keeping your selected context.
          </p>
        </div>

        <div className="hero-media">
          <ImageMosaic bucket="result-hero" count={6} labelPrefix="Result" />
        </div>
      </section>

      <section className="result-layout">
        <SectionReveal className="result-main">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Preview</CardTitle>
              <CardDescription>Source image used for this generated recommendation.</CardDescription>
            </CardHeader>
            <CardContent>
              {result.previewUrl ? (
                <img className="result-preview" src={result.previewUrl} alt="Uploaded portrait preview" />
              ) : (
                <p className="muted-line">Image preview unavailable.</p>
              )}
            </CardContent>
          </Card>

          <div className="below-card-actions">
            <Button type="button" size="lg" onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? "Regenerating..." : "Regenerate Photo"}
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/upload">Alternate Photo</Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Outfit Breakdown</CardTitle>
              <CardDescription>Core items selected by FitAura for this styling profile.</CardDescription>
            </CardHeader>
            <CardContent className="result-listing">
              {outfitItems.map((item) => (
                <div className="result-line" key={item.label}>
                  <span>{item.label}</span>
                  <p>{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Palette</CardTitle>
              <CardDescription>Use these colors as your matching foundation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="palette-grid" ref={paletteRef}>
                {paletteItems.map((item) => (
                  <motion.div key={item.id} className="palette-chip" whileHover={{ y: -5 }}>
                    <div className="palette-swatch" style={{ backgroundColor: item.hex }} />
                    <div className="palette-meta">
                      <strong>{item.name}</strong>
                      <span>{item.hex}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Confidence Tip</CardTitle>
              <CardDescription>Simple action to elevate your final appearance.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="tip-note tip-note--flat">
                <Sparkles size={16} />
                {result.confidenceTip}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share-Ready Summary</CardTitle>
              <CardDescription>Copy this quick breakdown to save or send to someone else.</CardDescription>
            </CardHeader>
            <CardContent className="share-summary">
              <textarea readOnly value={shareSummary} aria-label="Style summary" />
              <Button type="button" variant="secondary" onClick={copySummary}>
                {copyState === "copied" ? <Check size={16} /> : <Copy size={16} />}
                {copyState === "copied"
                  ? "Copied"
                  : copyState === "error"
                    ? "Copy Failed"
                    : "Copy Summary"}
              </Button>
            </CardContent>
          </Card>
        </SectionReveal>

        <SectionReveal className="result-aside" delay={0.06}>
          {result.analysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Snapshot</CardTitle>
                <CardDescription>Signals extracted from image analysis engines.</CardDescription>
              </CardHeader>
              <CardContent className="analysis-grid">
                <p>
                  <Brain size={16} />
                  Face shape: {result.analysis.face.shape}
                </p>
                <p>
                  <Camera size={16} />
                  Body silhouette: {result.analysis.body.silhouette}
                </p>
                <p>
                  <Sparkles size={16} />
                  Tone: {result.analysis.color.skinTone} ({result.analysis.color.undertone})
                </p>
                <p>
                  <RefreshCcw size={16} />
                  Overall confidence: {Math.round(result.analysis.overallConfidence * 100)}%
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Inspiration Board</CardTitle>
              <CardDescription>Random references to compare against your generated look.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageMosaic bucket="result-board" count={12} labelPrefix="Reference" />
            </CardContent>
          </Card>

          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Switch between your latest generated looks.</CardDescription>
              </CardHeader>
              <CardContent className="session-list">
                {history.map((session) => {
                  const isActive = session.createdAt === result.createdAt;

                  return (
                    <button
                      key={`${session.createdAt}-${session.occasion}`}
                      type="button"
                      className={`session-item ${isActive ? "session-item--active" : ""}`}
                      onClick={() => openSavedSession(session)}
                      disabled={isActive}
                    >
                      <strong>{session.occasion}</strong>
                      <span>{session.styleVibe} vibe</span>
                      <p>{formatSavedTime(session.createdAt)}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {error && (
            <Card>
              <CardHeader>
                <CardTitle>Regeneration Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="error-line">{error}</p>
              </CardContent>
            </Card>
          )}
        </SectionReveal>
      </section>
    </main>
  );
}
