import type { JSX } from "react";
import { ChatMessage } from "aihappey-types";
import { useState } from "react";
import { Drawer } from "./Drawer";

const uniq = (arr?: { url: string }[]) =>
  arr ? Array.from(new Map(arr.map((s) => [s.url, s])).values()) : [];

const SourceButton = ({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) => (
  <button
    type="button"
    className="btn btn-link p-0 ms-2"
    style={{ fontSize: 14, verticalAlign: "middle" }}
    onClick={onClick}
  >
    <span role="img" aria-label="sources" style={{ marginRight: 4 }}>
      🔗
    </span>
    {count} source{count > 1 ? "s" : ""}
  </button>
);

export const Chat = ({
  messages,
  onShowSources,
}: {
  messages?: ChatMessage[];
  onShowSources?: (sources: { title?: string; url: string }[]) => void;
}): JSX.Element => {
  return (
    <div className="d-flex flex-column gap-2">
      {messages?.map((m, i) => {
        const isUser = m.role === "user";
        //const uniqueSources = uniq(m.sources);
        const uniqueSources: any[] = [];
        return (
          <div
            key={i}
            className={
              "d-flex " +
              (isUser ? "justify-content-end" : "justify-content-start")
            }
          >
            <div
              className={
                "rounded px-3 py-2" +
                (isUser ? " bg-primary text-white" : " bg-light border")
              }
              style={{ maxWidth: "75%", position: "relative" }}
            >
              {uniqueSources.length ? (
                <SourceButton
                  count={uniqueSources.length}
                  onClick={() => onShowSources?.(uniqueSources)}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
