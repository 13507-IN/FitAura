"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { analyzeLook } from "@/lib/api";
import { saveLookResult } from "@/lib/storage";
import { OCCASIONS, STYLE_VIBES } from "@/types";

function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [styleVibe, setStyleVibe] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState("");

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
    <main className="page">
      <section className="hero">
        <p className="subtitle">Create Your Personalized Look</p>
        <h1>Upload Your Photo</h1>
        <p>Pick where you are going and the vibe you want. FitAura does the styling match for you.</p>
      </section>

      <section className="upload-grid">
        <article className="card">
          <div
            className={`dropzone ${isDragging ? "active" : ""}`}
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
              <img className="preview" src={previewUrl} alt="Uploaded preview" />
            ) : (
              <div>
                <strong>Drag & Drop image here</strong>
                <p>or</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
                />
              </div>
            )}
          </div>
          {previewUrl && (
            <p className="hint">
              To change image, drag and drop a new one or use the file picker in the settings card.
            </p>
          )}
        </article>

        <article className="card grid">
          <div className="field">
            <label htmlFor="photo-input">Image Upload</label>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="field">
            <label htmlFor="occasion">Occasion</label>
            <select id="occasion" value={occasion} onChange={(event) => setOccasion(event.target.value)}>
              {OCCASIONS.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="style">Style Vibe (Optional)</label>
            <select id="style" value={styleVibe} onChange={(event) => setStyleVibe(event.target.value)}>
              <option value="">Auto</option>
              {STYLE_VIBES.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="actions">
            <button className="button primary" type="button" disabled={isGenerating} onClick={handleGenerate}>
              {isGenerating ? "Generating..." : "Generate"}
            </button>
            <Link href="/" className="button secondary">
              Back
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
