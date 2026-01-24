
/* ============================================================
   Header
============================================================ */

import { NavDrawerHeader, Tooltip, Hamburger, Button, makeStyles } from "@fluentui/react-components";
import { Database24Regular, Cloud24Regular } from "@fluentui/react-icons";

type NavigationHeaderProps = {
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
    },
    rightIcons: { display: "flex", alignItems: "center" },
});


export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
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
                <Tooltip
                    relationship="label"
                    content={translations?.closeNavigation ?? "closeNavigation"}
                >
                    <span>
                        <Hamburger onClick={onClose} />
                    </span>
                </Tooltip>

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
                </div>
            </div>
        </NavDrawerHeader>
    );
};
