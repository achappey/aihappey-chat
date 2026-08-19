import { useCallback, useEffect, useState } from "react";

const BOTTOM_TOLERANCE_PX = 24;

export const useChatScrollToBottom = () => {
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const [hasContentBelow, setHasContentBelow] = useState(false);

  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    setScrollContainer(node);
  }, []);

  const updateScrollState = useCallback(() => {
    if (!scrollContainer) {
      setHasContentBelow(false);
      return;
    }

    const remainingScroll = scrollContainer.scrollHeight
      - scrollContainer.clientHeight
      - scrollContainer.scrollTop;
    const nextHasContentBelow = remainingScroll > BOTTOM_TOLERANCE_PX;

    setHasContentBelow((current) => current === nextHasContentBelow
      ? current
      : nextHasContentBelow);
  }, [scrollContainer]);

  useEffect(() => {
    if (!scrollContainer) return;

    updateScrollState();
    scrollContainer.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    let resizeObserver: ResizeObserver | undefined;
    let mutationObserver: MutationObserver | undefined;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(scrollContainer);

      const content = scrollContainer.firstElementChild;
      if (content instanceof HTMLElement) resizeObserver.observe(content);
    } else if (typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver(updateScrollState);
      mutationObserver.observe(scrollContainer, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      scrollContainer.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [scrollContainer, updateScrollState]);

  const scrollToBottom = useCallback(() => {
    if (!scrollContainer) return;

    const reduceMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [scrollContainer]);

  return {
    hasContentBelow,
    scrollContainerRef,
    scrollToBottom,
  };
};
