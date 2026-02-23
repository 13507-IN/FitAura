import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="subtitle">FitAura - AI Personal Stylist</p>
        <h1>Upload Your Photo. Get Your Best Look.</h1>
        <p>
          FitAura analyzes your photo and occasion, then recommends a polished outfit, accessories,
          and grooming tweaks tailored to your vibe.
        </p>
        <Link href="/upload" className="button primary">
          Try Now
        </Link>
      </section>
    </main>
  );
}
