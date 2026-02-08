import {
  ImageSettings,
  ImageSettingsForm
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useFiles } from "aihappey-files";
import { useEffect, useMemo, useState } from "react";

// --- General Tab ---
export const ImageSettingsGeneralTab = ({
  temperature,
  setTemperature,
  onEditProviderKeys
}: any) => {
  const { t } = useTranslation();
  const publishers = Object.entries(PROVIDERS).map(a => a[1].name).sort();
  const n = useAppStore(s => s.n)
  const seed = useAppStore(s => s.seed)
  const size = useAppStore(s => s.size)
  const maxImagesPerCall = useAppStore(s => s.maxImagesPerCall)
  const aspectRatio = useAppStore(s => s.aspectRatio)
  const setAspectRatio = useAppStore(s => s.setAspectRatio)
  const setSeed = useAppStore(s => s.setSeed)
  const setMaxImagesPerCall = useAppStore(s => s.setMaxImagesPerCall)
  const setSize = useAppStore(s => s.setSize)
  const setN = useAppStore(s => s.setN)

  const files = useFiles();
  const maskEntry = useMemo(
    () => (files.items ?? []).find((f) => f.name === "image_mask"),
    [files.items]
  );
  const [maskPreviewUrl, setMaskPreviewUrl] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    let cancelled = false;
    let urlToRevoke: string | undefined;

    const run = async () => {
      if (!maskEntry?.id) {
        setMaskPreviewUrl(undefined);
        return;
      }

      const stored = await files.read(maskEntry.id);
      if (!stored) {
        setMaskPreviewUrl(undefined);
        return;
      }

      urlToRevoke = URL.createObjectURL(stored.data);
      if (!cancelled) setMaskPreviewUrl(urlToRevoke);
    };

    void run();
    return () => {
      cancelled = true;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [files, maskEntry?.id]);

  const onSelectMaskFile = async (selected: File[]) => {
    if (!selected.length) return;
    const file = selected[0];

    // replace existing `image_mask`
    if (maskEntry?.id) {
      await files.delete(maskEntry.id);
    }

    await files.create({
      name: "image_mask",
      mimeType: file.type || "application/octet-stream",
      data: file,
    });

    files.refresh();
  };

  const onClearMaskFile = async () => {
    if (!maskEntry?.id) return;
    await files.delete(maskEntry.id);
    files.refresh();
  };

  const onChange = (next: ImageSettings) => {
    if (next.size !== size) setSize(next.size);
    if (next.aspectRatio !== aspectRatio) setAspectRatio(next.aspectRatio);
    if (next.n !== n) setN(next.n);
    if (next.maxImagesPerCall !== maxImagesPerCall) setMaxImagesPerCall(next.maxImagesPerCall);
    if (next.seed !== seed) setSeed(next.seed);
  };

  const settings = {
    size: size,
    aspectRatio: aspectRatio,
    n: n,
    maxImagesPerCall: maxImagesPerCall,
    seed: seed
  };


  return (
    <ImageSettingsForm value={settings}
      onChange={onChange}
      maskInfo={{
        exists: !!maskEntry,
        tagLabel: maskEntry?.name,
        previewUrl: maskPreviewUrl,
      }}
      onSelectMaskFile={(fs: File[]) => void onSelectMaskFile(fs)}
      onClearMaskFile={() => void onClearMaskFile()}
    />
  );
};
