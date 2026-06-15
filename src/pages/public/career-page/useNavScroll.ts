import { useEffect, useRef } from "react";

const CONTENT_WIDTH = 1300;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const scrollToProgress = (scrollY: number) => clamp(scrollY / 64, 0, 1);

export const useNavScroll = () => {
  const navRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const rafRef = useRef(0);
  const tickRafRef = useRef(0);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const getShellPad = () => {
      const shellPad = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--navShellPad",
        ) ||
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-shell-pad",
          ),
      );
      return Number.isFinite(shellPad) ? shellPad : 0;
    };

    const getExpandedWidth = () => window.innerWidth - getShellPad() * 2;

    const getContentWidth = () => {
      const cssContentWidth = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--content-width",
        ),
      );
      return Number.isFinite(cssContentWidth) ? cssContentWidth : CONTENT_WIDTH;
    };

    const getScrolledSideGap = () => {
      const sideGap = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--nav-side-gap-scrolled",
        ),
      );
      return Number.isFinite(sideGap) ? sideGap : 24;
    };

    const getCollapsedWidth = () => {
      const maxScrolledWidth =
        window.innerWidth - getShellPad() * 2 - getScrolledSideGap() * 2;

      if (window.innerWidth < 1024) {
        return Math.max(0, maxScrolledWidth);
      }

      return Math.min(Math.max(0, maxScrolledWidth), getContentWidth());
    };

    const renderNav = () => {
      const progress = progressRef.current;
      const width =
        getExpandedWidth() +
        (getCollapsedWidth() - getExpandedWidth()) * progress;

      nav.style.setProperty("--nav-progress", progress.toFixed(4));
      nav.style.setProperty("--nav-width", `${width.toFixed(2)}px`);
      nav.classList.toggle("isScrolled", progress > 0.02);
    };

    const syncTarget = (immediate = false) => {
      targetProgressRef.current = scrollToProgress(window.scrollY);

      if (immediate || reduceMotionQuery.matches) {
        progressRef.current = targetProgressRef.current;
        renderNav();
        return;
      }

      if (!tickRafRef.current) {
        tickRafRef.current = window.requestAnimationFrame(function tick() {
          const delta = targetProgressRef.current - progressRef.current;

          if (Math.abs(delta) < 0.001) {
            progressRef.current = targetProgressRef.current;
            renderNav();
            tickRafRef.current = 0;
            return;
          }

          progressRef.current += delta * 0.22;
          renderNav();
          tickRafRef.current = window.requestAnimationFrame(tick);
        });
      }
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        syncTarget(false);
      });
    };

    const onResize = () => syncTarget(true);
    const onReducedChange = () => syncTarget(true);

    syncTarget(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    reduceMotionQuery.addEventListener("change", onReducedChange);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      reduceMotionQuery.removeEventListener("change", onReducedChange);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (tickRafRef.current) window.cancelAnimationFrame(tickRafRef.current);
    };
  }, []);

  return navRef;
};
