"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  scale?: boolean;
  once?: boolean;
  className?: string;
  as?: "div" | "span" | "li" | "figure";
};

/** Reveals its contents with a subtle fade and vertical motion on viewport entry. */
export function ScrollReveal({
  children,
  delay = 0,
  y = 40,
  duration = 700,
  scale = false,
  once = true,
  className = "",
  as: Tag = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const hiddenTransform = `translateY(${y}px) scale(${scale ? 1.03 : 1})`;
    element.style.opacity = "0";
    element.style.transform = hiddenTransform;
    element.style.transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
    element.style.willChange = "opacity, transform";

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.style.opacity = "1";
        element.style.transform = "translateY(0) scale(1)";
        if (once) observer.unobserve(element);
      } else if (!once) {
        element.style.opacity = "0";
        element.style.transform = hiddenTransform;
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay, duration, once, scale, y]);

  return <Tag ref={ref as never} className={className}>{children}</Tag>;
}
