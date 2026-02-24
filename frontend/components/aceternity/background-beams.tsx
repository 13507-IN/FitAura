"use client";

import { motion } from "framer-motion";

const BEAMS = [
  { left: "6%", delay: 0.2, duration: 5.8 },
  { left: "22%", delay: 0.5, duration: 7.4 },
  { left: "39%", delay: 1.1, duration: 6.6 },
  { left: "58%", delay: 0.8, duration: 8.1 },
  { left: "74%", delay: 1.7, duration: 7.2 },
  { left: "90%", delay: 0.4, duration: 6.9 }
];

export function BackgroundBeams(): JSX.Element {
  return (
    <div className="beams-layer" aria-hidden>
      {BEAMS.map((beam) => (
        <motion.span
          key={beam.left}
          className="beam"
          style={{ left: beam.left }}
          initial={{ opacity: 0, y: -140 }}
          animate={{ opacity: [0, 0.4, 0], y: ["-10%", "118%"] }}
          transition={{
            duration: beam.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
            delay: beam.delay
          }}
        />
      ))}
    </div>
  );
}
