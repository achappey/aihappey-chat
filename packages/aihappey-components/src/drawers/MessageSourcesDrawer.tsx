import { useState, useMemo } from "react";
import { useTranslation } from "aihappey-i18n";
import { SourceUrlUIPart } from "aihappey-ai";
import { useTheme } from "../theme/ThemeContext";
import { SourceUrlCard } from "../cards";

interface MessageSourcesDrawerProps {
  open: boolean;
  sources: (SourceUrlUIPart)[];
  onClose: () => void;
  size?: "medium" | "small"
}

export const MessageSourcesDrawer = ({
  open,
  sources,
  size,
  onClose,
}: MessageSourcesDrawerProps) => {
  const { Drawer, Tabs, Tab } = useTheme();
  //  const PAGE = 100;
  const { t } = useTranslation();

  /* ---------- bucket by host ---------- */
  const hostBuckets = useMemo(() => {
    const map = new Map<string, SourceUrlUIPart[]>();
    sources.forEach((s) => {
      try {
        const host = new URL(s.url).hostname;
        (map.get(host) ?? (map.set(host, []), map.get(host)!)).push(s);
      } catch {
        /* ignore invalid URL */
      }
    });
    return map;
  }, [sources]);

  /* ---------- paging ---------- */
  //  const [visible, setVisible] = useState<Record<string, number>>({ all: PAGE });
  // const showMore = (key: string, max: number) =>
  //  setVisible((v) => ({ ...v, [key]: Math.min((v[key] ?? PAGE) + PAGE, max) }));

  const renderList = (key: string, list: SourceUrlUIPart[]) => {
    //  const shown = list.slice(0, visible[key] ?? PAGE);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((s, i) => (
          <SourceUrlCard key={i} source={s} />
        ))}

        {list.length === 0 && (
          <div style={{ padding: 16, textAlign: "center" }}>
            {t('noSources')}
          </div>
        )}
      </div>
    );
  };

  const [activeTab, setActiveTab] = useState("all");

  return (
    <Drawer open={open} overlay
      size={size}
      onClose={onClose}
      title={t('sources')}>
      <Tabs activeKey={activeTab}
        onSelect={setActiveTab}>
        <Tab eventKey="all" title={t('all') + ` (${sources.length})`}>
          {renderList("all", sources)}
        </Tab>
        {Array.from(hostBuckets, ([host, list]) => (
          <Tab key={host} eventKey={host} title={`${host} (${list.length})`}>
            {renderList(host, list)}
          </Tab>
        ))}
      </Tabs>
    </Drawer>
  );
};
