/**
 * MedsZop Glass Experience V3 — Coordinated Motion Variants
 * Restrained, high-performance animations that strictly respect prefers-reduced-motion.
 * Physics: smooth clinical damping, 150-250ms duration, zero workflow delay.
 */

export const pageTransitionVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: 'easeIn' }
  }
};

export const pageTransitionReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } }
};

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02
    }
  }
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
  }
};

export const cardHoverTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 25
};

export const buttonTapPhysics = {
  scale: 0.985,
  transition: { duration: 0.08 }
};
