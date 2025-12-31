import {
  ImageSettings,
  ImageSettingsForm
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";

// --- General Tab ---
export const ImageSettingsGeneralTab = ({
  temperature,
  setTemperature,
  onEditProviderKeys
}: any) => {
  const { t } = useTranslation();
  const publishers = Object.entries(PROVIDERS).map(a => a[1].name).sort();
  const appConfig = useChatContext();
  const enabledProviders = useAppStore(s => s.enabledProviders)
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
      onChange={onChange} />
  );
};