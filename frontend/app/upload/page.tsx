"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Info, LayoutGrid, RefreshCw, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Spotlight } from "@/components/aceternity/spotlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageMosaic } from "@/components/visual/image-mosaic";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { SectionReveal } from "@/components/visual/section-reveal";
import { analyzeLook, analyzeMultiPhoto } from "@/lib/api";
import { loadLookResult, saveLookResult } from "@/lib/storage";
import { loadWardrobe } from "@/lib/storage";
import { OCCASIONS, STYLE_VIBES } from "@/types";

function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

const STEPS = [
  "Upload one clear full photo",
  "Pick occasion and optional vibe",
  "Generate look recommendations"
];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export default function UploadPage(): JSX.Element {
  const router = useRouter();
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [styleVibe, setStyleVibe] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState<string>("");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const inspirationCount = useMemo(() => (previewUrls.length > 0 ? 12 : 8), [previewUrls]);

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const onFilesSelected = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (!isImage(file)) {
        setError("Please upload valid image files only.");
        return false;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`Image ${file.name} must be 5MB or smaller.`);
        return false;
      }
      return true;
    }).slice(0, 3);

    if (validFiles.length === 0) return;

    setError("");
    previewUrls.forEach(url => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 3));
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls].slice(0, 3));
  };

  const clearAllFiles = () => {
    previewUrls.forEach(url => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError("");
  };

  const removeFile = (index: number) => {
    const urlToRemove = previewUrls[index];
    if (urlToRemove?.startsWith("blob:")) {
      URL.revokeObjectURL(urlToRemove);
    }
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileSelect = () => {
    hiddenFileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (selectedFiles.length === 0) {
      setError("Add at least one photo before generating recommendations.");
      return;
    }

    setError("");
    setIsGenerating(true);
    setGenerationStep(0);

    try {
      const wardrobe = loadWardrobe();

      const stepInterval = window.setInterval(() => {
        setGenerationStep((prev) => Math.min(prev + 1, 4));
      }, 600);

      let result;
      if (selectedFiles.length === 1) {
        const formData = new FormData();
        formData.append("image", selectedFiles[0]);
        formData.append("occasion", occasion);
        formData.append("styleVibe", styleVibe);
        result = await analyzeLook(formData);
      } else {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });
        formData.append("occasion", occasion);
        formData.append("styleVibe", styleVibe);
        formData.append("wardrobe", JSON.stringify(wardrobe));
        result = await analyzeMultiPhoto(formData);
      }

      clearInterval(stepInterval);
      setGenerationStep(4);

      await new Promise((resolve) => window.setTimeout(resolve, 400));

      saveLookResult({
        ...result,
        occasion,
        styleVibe: styleVibe || "Auto",
        previewUrl: previewUrls[0] || "",
        createdAt: new Date().toISOString()
      });

      router.push("/result");
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Unable to generate suggestions.";
      setError(message);
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
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
                Drag and drop your images (up to 3), then set the event and vibe you want to project.
              </CardDescription>
            </CardHeader>
            <CardContent className="upload-card-content">
              <div
                className={`dropzone-modern ${isDragging ? "dropzone-modern--active" : ""}`}
                role="button"
                tabIndex={0}
                aria-label="Image upload area"
                aria-busy={isGenerating}
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
                  const dropped = Array.from(event.dataTransfer.files || []).slice(0, 3);
                  onFilesSelected(dropped);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    triggerFileSelect();
                  }
                }}
              >
                {previewUrls.length > 0 ? (
                  <div className="preview-wrapper">
                    <div className="multi-preview">
                      {previewUrls.map((url, idx) => (
                        <div key={url} className="multi-preview__item">
                          <img className="preview-image" src={url} alt={`Uploaded preview ${idx + 1}`} />
                          <button
                            type="button"
                            className="multi-preview__remove"
                            onClick={() => removeFile(idx)}
                            aria-label={`Remove photo ${idx + 1}`}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="preview-actions">
                      {selectedFiles.length < 3 && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={triggerFileSelect}
                          className="preview-change"
                        >
                          <RefreshCw size={15} />
                          Add Another Photo
                        </Button>
                      )}
                      <Button type="button" variant="ghost" onClick={clearAllFiles}>
                        Remove All
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="dropzone-empty">
                    <Camera size={28} />
                    <strong>Drop your images here</strong>
                    <p>or select them manually (up to 3 photos)</p>
                    <Button type="button" variant="secondary" onClick={triggerFileSelect}>
                      Upload Photos
                    </Button>
                  </div>
                )}
                <input
                  ref={hiddenFileInputRef}
                  className="sr-only-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    onFilesSelected(files);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
              <p className="muted-line">Accepted formats: JPG, PNG, WEBP. Max upload size: 5MB per file.</p>

              <div className="photo-guidance">
                <strong>Photo Tips:</strong>
                <ul>
                  <li>Use a clear, well-lit full-body or waist-up photo</li>
                  <li>Neutral pose with arms slightly away from body</li>
                  <li>Avoid heavy filters or dark shadows</li>
                </ul>
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

              {isGenerating && <ProgressSteps currentStep={generationStep} />}
            </CardContent>
          </Card>

          <div className="below-card-actions">
            <Button type="button" size="lg" onClick={handleGenerate} disabled={isGenerating || selectedFiles.length === 0}>
              {isGenerating ? "Generating..." : "Generate Look"}
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/wardrobe">
                <LayoutGrid size={16} />
                My Wardrobe
              </Link>
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
              <div className="tip-note tip-note--privacy">
                <ShieldCheck size={16} />
                Your photo is processed in-memory and never stored on our servers.
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
