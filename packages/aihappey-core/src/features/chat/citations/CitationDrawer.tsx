import { useState, useMemo } from "react";
import { useTheme } from "aihappey-components";

import { CitationCard } from "./CitationCard";
import { useTranslation } from "aihappey-i18n";
import { useMediaQuery } from "usehooks-ts";
import { useIsDesktop } from "../../../shell/responsive/useIsDesktop";
import { SourceDocumentUIPart, SourceUrlUIPart } from "aihappey-ai";

interface Source {
  title?: string;
  url: string;
}

interface CitationDrawerProps {
  open: boolean;
  sources: (SourceUrlUIPart)[];
  onClose: () => void;
}

export const CitationDrawer = ({
  open,
  sources,
  onClose,
}: CitationDrawerProps) => {
  const { Drawer, Tabs, Tab, Button } = useTheme();
  const PAGE = 100;
  const { t } = useTranslation();
  /* ---------- de-duplicate ---------- */
  const unique = useMemo(() => {
    const seen = new Set<string>();
    return sources.filter((s) => {
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    });
  }, [sources]);
  const isDesktop = useIsDesktop();

  /* ---------- bucket by host ---------- */
  const hostBuckets = useMemo(() => {
    const map = new Map<string, Source[]>();
    unique.forEach((s) => {
      try {
        const host = new URL(s.url).hostname;
        (map.get(host) ?? (map.set(host, []), map.get(host)!)).push(s);
      } catch {
        /* ignore invalid URL */
      }
    });
    return map;
  }, [unique]);

  /* ---------- paging ---------- */
  const [visible, setVisible] = useState<Record<string, number>>({ all: PAGE });
  const showMore = (key: string, max: number) =>
    setVisible((v) => ({ ...v, [key]: Math.min((v[key] ?? PAGE) + PAGE, max) }));

  const renderList = (key: string, list: Source[]) => {
    const shown = list.slice(0, visible[key] ?? PAGE);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {shown.map((s, i) => (
          <CitationCard key={i} title={s.title} url={s.url} />
        ))}
        {list.length > shown.length && (
          <Button
            size="small"
            variant="subtle"
            onClick={() => showMore(key, list.length)}
          >
            + {Math.min(PAGE, list.length - shown.length)} more
          </Button>
        )}
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
      size={isDesktop ? "medium" : "small"}
      onClose={onClose}
      title={t('sources')}>
      <Tabs activeKey={activeTab}
        onSelect={setActiveTab}>
        <Tab eventKey="all" title={t('all') + ` (${unique.length})`}>
          {renderList("all", unique)}
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
