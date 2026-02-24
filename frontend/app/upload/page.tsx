"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, RefreshCcw, Sparkles, Wand2 } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Spotlight } from "@/components/aceternity/spotlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageMosaic } from "@/components/visual/image-mosaic";
import { SectionReveal } from "@/components/visual/section-reveal";
import { analyzeLook } from "@/lib/api";
import { saveLookResult } from "@/lib/storage";
import { OCCASIONS, STYLE_VIBES } from "@/types";

function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

const STEPS = [
  "Upload one clear full photo",
  "Pick occasion and optional vibe",
  "Generate look recommendations"
];

export default function UploadPage(): JSX.Element {
  const router = useRouter();
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [styleVibe, setStyleVibe] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const inspirationCount = useMemo(() => (previewUrl ? 12 : 8), [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onFileSelected = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!isImage(file)) {
      setError("Please upload a valid image file.");
      return;
    }

    setError("");
    setSelectedFile(file);

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
  };

  const triggerFileSelect = () => {
    hiddenFileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Add a photo before generating recommendations.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("occasion", occasion);
      formData.append("styleVibe", styleVibe);

      const result = await analyzeLook(formData);

      saveLookResult({
        ...result,
        occasion,
        styleVibe: styleVibe || "Auto",
        previewUrl
      });

      router.push("/result");
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Unable to generate suggestions.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="site-page">
      <section className="hero-shell hero-shell--upload">
        <Spotlight className="spotlight--left" fill="14, 116, 144" />
        <Spotlight className="spotlight--right" fill="245, 158, 11" delay={0.22} />
        <BackgroundBeams />

        <div className="hero-copy">
          <Badge>Styling Session</Badge>
          <h1>Upload your photo and build a complete look in under a minute.</h1>
          <p>
            FitAura uses your image + occasion context to generate outfit pieces, accessories, hairstyle direction,
            and confidence tips.
          </p>
          <div className="hero-actions">
            <Button asChild variant="secondary" size="lg">
              <Link href="/">Back Home</Link>
            </Button>
          </div>
        </div>

        <div className="hero-media">
          <ImageMosaic bucket="upload-hero" count={6} labelPrefix="Fit" />
        </div>
      </section>

      <section className="upload-layout">
        <SectionReveal className="upload-main">
          <Card className="upload-card">
            <CardHeader>
              <CardTitle>Photo + Styling Controls</CardTitle>
              <CardDescription>
                Drag and drop your image, then set the event and vibe you want to project.
              </CardDescription>
            </CardHeader>
            <CardContent className="upload-card-content">
              <div
                className={`dropzone-modern ${isDragging ? "dropzone-modern--active" : ""}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  const dropped = event.dataTransfer.files?.[0] ?? null;
                  onFileSelected(dropped);
                }}
              >
                {previewUrl ? (
                  <div className="preview-wrapper">
                    <img className="preview-image" src={previewUrl} alt="Uploaded preview" />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={triggerFileSelect}
                      className="preview-change"
                    >
                      <RefreshCcw size={15} />
                      Upload New Photo
                    </Button>
                  </div>
                ) : (
                  <div className="dropzone-empty">
                    <Camera size={28} />
                    <strong>Drop your image here</strong>
                    <p>or select one manually</p>
                    <Button type="button" variant="secondary" onClick={triggerFileSelect}>
                      Upload Photo
                    </Button>
                  </div>
                )}
                <input
                  ref={hiddenFileInputRef}
                  className="sr-only-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
                />
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Occasion</span>
                  <select value={occasion} onChange={(event) => setOccasion(event.target.value)}>
                    {OCCASIONS.map((value) => (
                      <option value={value} key={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Style Vibe (optional)</span>
                  <select value={styleVibe} onChange={(event) => setStyleVibe(event.target.value)}>
                    <option value="">Auto</option>
                    {STYLE_VIBES.map((value) => (
                      <option value={value} key={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {error && <p className="error-line">{error}</p>}
            </CardContent>
          </Card>

          <div className="below-card-actions">
            <Button type="button" size="lg" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Photo"}
            </Button>
          </div>
        </SectionReveal>

        <SectionReveal className="upload-aside" delay={0.08}>
          <Card>
            <CardHeader>
              <CardTitle>Session Checklist</CardTitle>
              <CardDescription>Use this quick flow for best recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="stack-list">
              {STEPS.map((step, index) => (
                <div className="check-item" key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
              <div className="tip-note">
                <Sparkles size={16} />
                Better lighting and a neutral pose improve color + shape detection quality.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Inspiration Board</CardTitle>
              <CardDescription>Random style shots to spark outfit direction.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageMosaic bucket="upload-board" count={inspirationCount} labelPrefix="Inspo" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What You Get</CardTitle>
              <CardDescription>Generated with AI + animation-enhanced UX libraries.</CardDescription>
            </CardHeader>
            <CardContent className="stack-list">
              <p>
                <Wand2 size={16} /> Outfit recommendations by category.
              </p>
              <p>
                <Sparkles size={16} /> Color palette, accessories, and hairstyle guidance.
              </p>
              <p>
                <Camera size={16} /> Confidence tip tuned to your chosen occasion.
              </p>
            </CardContent>
          </Card>
        </SectionReveal>
      </section>
    </main>
  );
}
