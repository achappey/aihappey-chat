import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
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
  formRef: RefObject<HTMLFormElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  resetKey?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const useResizableMessageInput = ({
  formRef,
  textareaRef,
  resetKey,
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
    formRef.current?.closest<HTMLElement>("[data-chat-resize-scope]") ?? undefined,
  [formRef]);

  const getAvailableHeight = useCallback(() => {
    const scopeHeight = getResizeScope()?.clientHeight;
    if (scopeHeight) return scopeHeight;

    return window.visualViewport?.height ?? window.innerHeight;
  }, [getResizeScope]);

  const measureLimits = useCallback((remeasureMinimum = false) => {
    const textarea = textareaRef.current;
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
  }, [getAvailableHeight, textareaRef]);

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
      resizeTo(drag.startHeight + drag.startY - event.clientY, drag.anchors);
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
  }, [dragging, resizeTo]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const textarea = textareaRef.current;
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
  }, [captureScrollAnchors, measureLimits, textareaRef]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const textarea = textareaRef.current;
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
  }, [captureScrollAnchors, height, measureLimits, resizeTo, textareaRef]);

  return {
    height,
    minimumHeight,
    maximumHeight,
    dragging,
    onPointerDown,
    onKeyDown,
  };
};
