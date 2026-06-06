
/* ============================================================
   Header
============================================================ */

import { NavDrawerHeader, Tooltip, Hamburger, Button, makeStyles } from "@fluentui/react-components";
import { Database24Regular, Cloud24Regular } from "@fluentui/react-icons";

type NavigationHeaderProps = {
    appTitle?: string;
    storageType: "local" | "remote";
    onClose?: () => void;
    onStorageSwitch?: (t: "local" | "remote") => void;
    translations?: Record<string, string>;
};

const useStyles = makeStyles({
    headerBar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: "8px",
        minHeight: "32px",
    },
    appTitle: {
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        minHeight: "32px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "18px",
        fontWeight: 600,
        lineHeight: "32px",
    },
    rightIcons: { display: "flex", alignItems: "center", gap: "2px", flexShrink: 0, minHeight: "32px" },
});


export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
    appTitle,
    storageType,
    onClose,
    onStorageSwitch,
    translations,
}) => {
    const styles = useStyles();
    const StorageIcon = storageType === "local" ? Database24Regular : Cloud24Regular;

    return (
        <NavDrawerHeader>
            <div className={styles.headerBar}>
                <div className={styles.appTitle} title={appTitle ?? "AIHappey"}>{appTitle ?? "AIHappey"}</div>

                <div className={styles.rightIcons}>
                    {onStorageSwitch && (
                        <Tooltip
                            relationship="label"
                            content={`Opslag: ${storageType === "local" ? "Lokaal" : "Cloud"}`}
                        >
                            <Button
                                aria-label="Wissel opslag"
                                icon={<StorageIcon />}
                                appearance="transparent"
                                onClick={() =>
                                    onStorageSwitch(storageType === "local" ? "remote" : "local")
                                }
                                type="button"
                            />
                        </Tooltip>
                    )}
                    <Tooltip
                        relationship="label"
                        content={translations?.closeNavigation ?? "closeNavigation"}
                    >
                        <span>
                            <Hamburger onClick={onClose} />
                        </span>
                    </Tooltip>
                </div>
            </div>
        </NavDrawerHeader>
    );
};
