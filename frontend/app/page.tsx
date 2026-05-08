"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Clock3, Image as ImageIcon, Palette, Sparkles, Wand2, Camera, Shirt, Eye, ChevronRight } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Spotlight } from "@/components/aceternity/spotlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageMosaic } from "@/components/visual/image-mosaic";
import { SectionReveal } from "@/components/visual/section-reveal";
import { loadLookHistory, saveLookResult } from "@/lib/storage";
import type { StoredLookResult } from "@/types";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FEATURES: Feature[] = [
  {
    title: "AI photo intelligence",
    description: "Reads facial shape, body silhouette, and tone cues to style around your strengths.",
    icon: ImageIcon
  },
  {
    title: "Occasion-first suggestions",
    description: "Generates combinations tuned for interviews, dates, travel, and events in seconds.",
    icon: Wand2
  },
  {
    title: "Color harmony engine",
    description: "Delivers polished palettes for tops, bottoms, footwear, and accessories with confidence tips.",
    icon: Palette
  }
];

const STATS = [
  { value: "1-click", label: "Look generation" },
  { value: "100+", label: "Mood visuals" },
  { value: "3 layers", label: "AI + motion + UI" }
];

const GUIDE_STEPS = [
  {
    icon: <Camera size={20} />,
    title: "Upload a Photo",
    desc: "Take or upload your selfie and pick an occasion & style.",
    link: "/upload",
    label: "Start here"
  },
  {
    icon: <Shirt size={20} />,
    title: "Add to Wardrobe",
    desc: "Log clothes you already own for smarter recommendations.",
    link: "/wardrobe",
    label: "Manage items"
  },
  {
    icon: <Eye size={20} />,
    title: "View Results",
    desc: "See your full outfit breakdown with color palette & tips.",
    link: "/result",
    label: "See results"
  }
];

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

export default function LandingPage(): JSX.Element {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [recentLooks, setRecentLooks] = useState<StoredLookResult[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const context = gsap.context(() => {
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current,
          { y: 36, opacity: 0, filter: "blur(8px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: "power3.out" }
        );
      }

      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.children,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: "power2.out", delay: 0.35 }
        );
      }
    });

    return () => context.revert();
  }, []);

  useEffect(() => {
    setRecentLooks(loadLookHistory().slice(0, 3));
    const seen = localStorage.getItem("fitaura:guide-seen");
    if (!seen) {
      setShowGuide(true);
    }
  }, []);

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("fitaura:guide-seen", "true");
  };

  const openSavedSession = (session: StoredLookResult) => {
    saveLookResult(session);
    router.push("/result");
  };

  return (
    <main className="site-page">
      {showGuide && (
        <div className="tutorial-overlay">
          <div className="tutorial-card tutorial-card--wide">
            <h2>Welcome to FitAura</h2>
            <p className="tutorial-sub">Your AI personal stylist. Here is how it works:</p>
            <div className="guide-grid">
              {GUIDE_STEPS.map((step, i) => (
                <div key={step.title} className="guide-card">
                  <span className="guide-card__num">0{i + 1}</span>
                  <div className="guide-card__icon">{step.icon}</div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  <Link href={step.link} className="guide-card__link" onClick={dismissGuide}>
                    {step.label} <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
            <Button onClick={dismissGuide} size="lg">
              Start Exploring <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      <section className="hero-shell hero-shell--landing">
        <Spotlight className="spotlight--left" fill="29, 78, 216" />
        <Spotlight className="spotlight--right" fill="13, 148, 136" delay={0.2} />
        <BackgroundBeams />

        <div className="hero-copy">
          <Badge>FitAura AI Stylist</Badge>
          <h1 ref={headingRef}>Make every outfit look intentional, premium, and camera ready.</h1>
          <p>
            Upload one photo, choose an occasion, and get a complete outfit formula with accessories, hairstyle,
            color palette, and confidence coaching.
          </p>
          <div className="hero-actions">
            <div className="tutorial-hint-wrapper">
              <Button asChild size="lg">
                <Link href="/upload">
                  Start Styling <ArrowRight size={16} />
                </Link>
              </Button>
              <span className="tutorial-hint tutorial-hint--primary">Upload your photo & get styled</span>
            </div>
            <div className="tutorial-hint-wrapper">
              <Button asChild variant="secondary" size="lg">
                <Link href="/result">View Last Result</Link>
              </Button>
              <span className="tutorial-hint">Reopen your last look</span>
            </div>
          </div>
        </div>

        <div className="hero-media">
          <ImageMosaic bucket="landing" count={8} labelPrefix="Mood" />
        </div>
      </section>

      <SectionReveal>
        <div className="stats-row" ref={statsRef}>
          {STATS.map((item) => (
            <motion.div key={item.label} className="stat-tile" whileHover={{ y: -6 }}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </motion.div>
          ))}
        </div>
      </SectionReveal>

      <SectionReveal className="content-section">
        <div className="section-top">
          <Badge variant="secondary">Quick Start Guide</Badge>
          <h2>Three simple steps to your perfect look</h2>
        </div>
        <div className="guide-grid">
          {GUIDE_STEPS.map((step, i) => (
            <motion.div key={step.title} whileHover={{ y: -6 }}>
              <Card className="guide-card-alt">
                <CardHeader>
                  <div className="guide-card-alt__head">
                    <span className="guide-card__num">{String(i + 1).padStart(2, "0")}</span>
                    <div className="guide-card__icon">{step.icon}</div>
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={step.link}>
                      {step.label} <ChevronRight size={14} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </SectionReveal>

      <SectionReveal className="content-section">
        <div className="section-top">
          <Badge variant="secondary">Why FitAura</Badge>
          <h2>Built with modern AI + animation for a premium experience</h2>
        </div>
        <div className="feature-grid">
          {FEATURES.map((feature, index) => (
            <motion.div key={feature.title} whileHover={{ y: -8 }} transition={{ duration: 0.2 }}>
              <Card>
                <CardHeader>
                  <feature.icon size={20} className="card-icon" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="card-tagline">
                    <Sparkles size={15} />
                    Layered styling logic {index + 1}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </SectionReveal>

      <SectionReveal className="content-section">
        <div className="section-top">
          <Badge variant="secondary">Recent Sessions</Badge>
          <h2>Reopen your latest style sessions instantly.</h2>
        </div>
        {recentLooks.length > 0 ? (
          <div className="session-grid">
            {recentLooks.map((session) => (
              <Card key={`${session.createdAt}-${session.occasion}`}>
                <CardHeader>
                  <CardTitle>{session.occasion}</CardTitle>
                  <CardDescription>{session.styleVibe} vibe</CardDescription>
                </CardHeader>
                <CardContent className="session-card-content">
                  <p className="session-time">
                    <Clock3 size={14} />
                    {formatSavedTime(session.createdAt)}
                  </p>
                  <div className="tutorial-hint-wrapper">
                    <Button type="button" variant="secondary" onClick={() => openSavedSession(session)}>
                      Open In Results
                    </Button>
                    <span className="tutorial-hint">Revisit this saved look</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="empty-history-card">
            <CardHeader>
              <CardTitle>No sessions yet</CardTitle>
              <CardDescription>Generate your first look and it will show up here for quick access.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="tutorial-hint-wrapper">
                <Button asChild size="lg">
                  <Link href="/upload">Start Your First Session</Link>
                </Button>
                <span className="tutorial-hint">Begin by uploading a photo</span>
              </div>
            </CardContent>
          </Card>
        )}
      </SectionReveal>
    </main>
  );
}
