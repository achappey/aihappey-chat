import React from "react";
import { FreepikImageExpandCardForm, FreepikImageExpandConfig } from "./image/cards/FreepikImageExpandCardForm";
import { FreepikSkinEnhancerCreativeCardForm, FreepikSkinEnhancerCreative } from "./image/cards/FreepikSkinEnhancerCreativeCardForm";
import { FreepikSkinEnhancerFaithfulCardForm, FreepikSkinEnhancerFaithful } from "./image/cards/FreepikSkinEnhancerFaithfulCardForm";
import { FreepikSkinEnhancerFlexibleCardForm, FreepikSkinEnhancerFlexible } from "./image/cards/FreepikSkinEnhancerFlexibleCardForm";
import { FreepikUpscalerCreativeCardForm, FreepikUpscalerCreative } from "./image/cards/FreepikUpscalerCreativeCardForm";
import { FreepikUpscalerPrecisionCardForm, FreepikUpscalerPrecisionV1 } from "./image/cards/FreepikUpscalerPrecisionCardForm";
import { FreepikUpscalerPrecisionV2CardForm, FreepikUpscalerPrecisionV2 } from "./image/cards/FreepikUpscalerPrecisionV2CardForm";
import { pruneEmptyObject } from "./image/cards/shared";

/**
 * UI config bucket for image provider metadata: `providerImageMetadata.freepik`.
 *
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `FreepikImageProviderMetadata` (excluding icon_generation by request).
 */
export type FreepikImageConfig = {
  skin_enhancer?: {
    creative?: FreepikSkinEnhancerCreative;
    faithful?: FreepikSkinEnhancerFaithful;
    flexible?: FreepikSkinEnhancerFlexible;
  };
  image_expand?: FreepikImageExpandConfig;
  upscaler?: {
    creative?: FreepikUpscalerCreative;
    precision?: FreepikUpscalerPrecisionV1;
    precision_v2?: FreepikUpscalerPrecisionV2;
  };
};

export const FreepikImageConfigForm: React.FC<{
  config: FreepikImageConfig;
  updateConfig: (val: FreepikImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const update = (patch: Partial<FreepikImageConfig>) => {
    const merged: FreepikImageConfig = { ...config, ...patch };
    updateConfig({
      ...merged,
      skin_enhancer: pruneEmptyObject({
        creative: merged.skin_enhancer?.creative,
        faithful: merged.skin_enhancer?.faithful,
        flexible: merged.skin_enhancer?.flexible,
      } as any) as any,
      image_expand: pruneEmptyObject(merged.image_expand),
      upscaler: pruneEmptyObject({
        creative: merged.upscaler?.creative,
        precision: merged.upscaler?.precision,
        precision_v2: merged.upscaler?.precision_v2,
      } as any) as any,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <FreepikImageExpandCardForm
        value={config.image_expand}
        onChange={(next) => update({ image_expand: next })}
      />

      <FreepikSkinEnhancerCreativeCardForm
        value={config.skin_enhancer?.creative}
        onChange={(next) =>
          update({
            skin_enhancer: {
              ...(config.skin_enhancer ?? {}),
              creative: next,
            },
          })
        }
      />

      <FreepikSkinEnhancerFaithfulCardForm
        value={config.skin_enhancer?.faithful}
        onChange={(next) =>
          update({
            skin_enhancer: {
              ...(config.skin_enhancer ?? {}),
              faithful: next,
            },
          })
        }
      />

      <FreepikSkinEnhancerFlexibleCardForm
        value={config.skin_enhancer?.flexible}
        onChange={(next) =>
          update({
            skin_enhancer: {
              ...(config.skin_enhancer ?? {}),
              flexible: next,
            },
          })
        }
      />

      <FreepikUpscalerCreativeCardForm
        value={config.upscaler?.creative}
        onChange={(next) =>
          update({
            upscaler: {
              ...(config.upscaler ?? {}),
              creative: next,
            },
          })
        }
      />

      <FreepikUpscalerPrecisionCardForm
        value={config.upscaler?.precision}
        onChange={(next) =>
          update({
            upscaler: {
              ...(config.upscaler ?? {}),
              precision: next,
            },
          })
        }
      />

      <FreepikUpscalerPrecisionV2CardForm
        value={config.upscaler?.precision_v2}
        onChange={(next) =>
          update({
            upscaler: {
              ...(config.upscaler ?? {}),
              precision_v2: next,
            },
          })
        }
      />
    </div>
  );
};

