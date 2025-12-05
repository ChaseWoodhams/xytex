"use client";

import { LazyMotion, domAnimation } from "framer-motion";

interface MotionProviderProps {
  children: React.ReactNode;
}

/**
 * MotionProvider wraps the app with LazyMotion for reduced bundle size.
 * Uses domAnimation which is the minimal animation bundle (~5KB vs ~50KB).
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}

