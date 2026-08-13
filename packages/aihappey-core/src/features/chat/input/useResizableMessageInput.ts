import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

const MAX_VIEWPORT_RATIO = 0.45;
const KEYBOARD_STEP = 24;
const BOTTOM_THRESHOLD = 48;

type ScrollAnchor = {
  element: HTMLElement;
  wasNearBottom: boolean;
};

type DragState = {
  pointerId: number;
  startY: number;
  startHeight: number;
  anchors: ScrollAnchor[];
};

type UseResizableMessageInputOptions = {
  containerRef: RefObject<HTMLElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  resetKey?: string;
  direction?: "up" | "down";
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const useResizableMessageInput = ({
  containerRef,
  textareaRef,
  resetKey,
  direction = "up",
}: UseResizableMessageInputOptions) => {
  const [height, setHeight] = useState<number>();
  const [minimumHeight, setMinimumHeight] = useState(0);
  const [maximumHeight, setMaximumHeight] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<DragState | undefined>(undefined);
  const minimumHeightRef = useRef(0);
  const maximumHeightRef = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);

  const getResizeScope = useCallback(() =>
    containerRef.current?.closest<HTMLElement>("[data-chat-resize-scope]") ?? undefined,
  [containerRef]);

  const getTextarea = useCallback(() => {
    const referencedElement = textareaRef.current as HTMLElement | null;
    const textarea = referencedElement?.tagName === "TEXTAREA"
      ? referencedElement as HTMLTextAreaElement
      : referencedElement?.querySelector<HTMLTextAreaElement>("textarea")
        ?? containerRef.current?.querySelector<HTMLTextAreaElement>("textarea")
        ?? null;
    if (textarea && textareaRef.current !== textarea) {
      (textareaRef as MutableRefObject<HTMLTextAreaElement | null>).current = textarea;
    }
    return textarea;
  }, [containerRef, textareaRef]);

  const getAvailableHeight = useCallback(() => {
    const scopeHeight = getResizeScope()?.clientHeight;
    if (scopeHeight) return scopeHeight;

    return window.visualViewport?.height ?? window.innerHeight;
  }, [getResizeScope]);

  const measureLimits = useCallback((remeasureMinimum = false) => {
    const textarea = getTextarea();
    if (!textarea) return;

    if (remeasureMinimum || minimumHeightRef.current === 0) {
      const measuredMinimum = Math.ceil(textarea.getBoundingClientRect().height);
      minimumHeightRef.current = measuredMinimum;
      setMinimumHeight(measuredMinimum);
    }

    const nextMaximum = Math.max(
      minimumHeightRef.current,
      Math.floor(getAvailableHeight() * MAX_VIEWPORT_RATIO),
    );
    maximumHeightRef.current = nextMaximum;
    setMaximumHeight(nextMaximum);
    setHeight((current) => current === undefined
      ? current
      : clamp(current, minimumHeightRef.current, nextMaximum));
  }, [getAvailableHeight, getTextarea]);

  const captureScrollAnchors = useCallback((): ScrollAnchor[] => {
    const scope = getResizeScope();
    if (!scope) return [];

    return Array.from(
      scope.querySelectorAll<HTMLElement>("[data-chat-scroll-container]"),
    ).map((element) => ({
      element,
      wasNearBottom:
        element.scrollHeight - element.scrollTop - element.clientHeight <= BOTTOM_THRESHOLD,
    }));
  }, [getResizeScope]);

  const restoreScrollAnchors = useCallback((anchors: ScrollAnchor[]) => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      anchors.forEach(({ element, wasNearBottom }) => {
        if (wasNearBottom) element.scrollTop = element.scrollHeight;
      });
      frameRef.current = undefined;
    });
  }, []);

  const resizeTo = useCallback((nextHeight: number, anchors: ScrollAnchor[]) => {
    const min = minimumHeightRef.current;
    const max = maximumHeightRef.current || min;
    setHeight(clamp(nextHeight, min, max));
    restoreScrollAnchors(anchors);
  }, [restoreScrollAnchors]);

  useLayoutEffect(() => {
    const textarea = getTextarea();
    if (!textarea) return;
    textarea.style.resize = "none";
    textarea.style.width = "100%";
    textarea.style.boxSizing = "border-box";
    textarea.style.display = "block";
    textarea.style.minHeight = minimumHeight ? `${minimumHeight}px` : "";
    textarea.style.maxHeight = maximumHeight ? `${maximumHeight}px` : "";
    textarea.style.height = height === undefined ? "" : `${height}px`;
  }, [getTextarea, height, maximumHeight, minimumHeight]);

  useLayoutEffect(() => {
    measureLimits(true);
  }, [measureLimits, resetKey]);

  useEffect(() => {
    const scope = getResizeScope();
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(() => measureLimits());
    if (scope) resizeObserver?.observe(scope);

    const visualViewport = window.visualViewport;
    const handleViewportResize = () => measureLimits();
    window.addEventListener("resize", handleViewportResize);
    visualViewport?.addEventListener("resize", handleViewportResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleViewportResize);
      visualViewport?.removeEventListener("resize", handleViewportResize);
    };
  }, [getResizeScope, measureLimits]);

  useEffect(() => {
    setHeight(undefined);
    minimumHeightRef.current = 0;
    maximumHeightRef.current = 0;

    const frame = requestAnimationFrame(() => measureLimits(true));
    return () => cancelAnimationFrame(frame);
  }, [measureLimits, resetKey]);

  useEffect(() => () => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      event.preventDefault();
      const delta = direction === "up"
        ? drag.startY - event.clientY
        : event.clientY - drag.startY;
      resizeTo(drag.startHeight + delta, drag.anchors);
    };

    const finishDrag = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = undefined;
      setDragging(false);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, [direction, dragging, resizeTo]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const textarea = getTextarea();
    if (!textarea) return;

    event.preventDefault();
    measureLimits();
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: textarea.getBoundingClientRect().height,
      anchors: captureScrollAnchors(),
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    setDragging(true);
  }, [captureScrollAnchors, getTextarea, measureLimits]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const textarea = getTextarea();
    if (!textarea) return;

    let nextHeight: number | undefined;
    const currentHeight = height ?? textarea.getBoundingClientRect().height;
    if (event.key === "ArrowUp") nextHeight = currentHeight + KEYBOARD_STEP;
    if (event.key === "ArrowDown") nextHeight = currentHeight - KEYBOARD_STEP;
    if (event.key === "Home") nextHeight = minimumHeightRef.current;
    if (nextHeight === undefined) return;

    event.preventDefault();
    measureLimits();
    resizeTo(nextHeight, captureScrollAnchors());
  }, [captureScrollAnchors, getTextarea, height, measureLimits, resizeTo]);

  return {
    height,
    minimumHeight,
    maximumHeight,
    dragging,
    onPointerDown,
    onKeyDown,
  };
};
