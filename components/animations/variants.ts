/**
 * @file components/animations/variants.ts
 * Shared Framer Motion animation variants.
 *
 * WHY: Defining variants centrally ensures visual consistency across the app.
 * Components import the variant they need rather than defining inline objects,
 * which would cause unnecessary re-renders (new object reference on every render).
 *
 * Naming: Verb-based (fadeIn, slideUp) — describes what the element does,
 * not what it looks like.
 */

import type { Variants } from "framer-motion";

// ─── Fade ─────────────────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

export const fadeInSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// ─── Slide ────────────────────────────────────────────────────────────────────

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
};

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Scale ────────────────────────────────────────────────────────────────────

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
};

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

// ─── Stagger containers ───────────────────────────────────────────────────────

/**
 * Parent container variant — use with child variants to stagger
 * entry animations across a list of items.
 *
 * @example
 * <motion.ul variants={staggerChildren}>
 *   {items.map(item => (
 *     <motion.li variants={slideUp}>{item.label}</motion.li>
 *   ))}
 * </motion.ul>
 */
export const staggerChildren: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerChildrenFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

// ─── Layout-specific ──────────────────────────────────────────────────────────

/** Sidebar entrance — slides in from the left. */
export const sidebarVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/** Dashboard card entrance — used for stat cards and chart cards. */
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/**
 * Number counter animation — for animating numeric values in stat cards.
 * Pair with Framer Motion's `animate` prop and a numeric value.
 */
export const counterTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  mass: 0.5,
} as const;
