import type { ReactNode } from "react";
import { useDarkMode } from "usehooks-ts";

export type StickyHeaderBarProps = {
    leftContent?: ReactNode;
    centerContent?: ReactNode;
    rightContent?: ReactNode;
    height?: number;
};

export const StickyHeaderBar = ({
    leftContent,
    centerContent,
    rightContent,
    height = 48,
}: StickyHeaderBarProps) => {
    const { isDarkMode } = useDarkMode();

    return (
        <div
            style={{
                position: "sticky",
                top: 0,
                width: "100%",
                zIndex: 10,
                boxSizing: "border-box",
                padding: "0px 12px",
                height,
                display: "flex",
                alignItems: "center",
                //  padding: "0 12px",
                backgroundColor: isDarkMode ? "#292929" : "#ffffff",
                gap: 8,
            }}
        >
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                {leftContent}
            </div>
            <div style={{ flex: "none", display: "flex", alignItems: "center" }}>
                {centerContent}
            </div>
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 8,
                }}
            >
                {rightContent}
            </div>
        </div>
    );
};
