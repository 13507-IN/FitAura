"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  className?: string;
  fill?: string;
  delay?: number;
}

export function Spotlight({ className, fill = "59, 130, 246", delay = 0 }: SpotlightProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, delay }}
      className={cn("spotlight", className)}
      style={{
        background: `radial-gradient(circle, rgba(${fill},0.28) 0%, rgba(${fill},0.15) 28%, rgba(255,255,255,0) 72%)`
      }}
    />
  );
}
