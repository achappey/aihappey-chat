import { useEffect, useState } from "react";
import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

export type MireyeChatConfig =
  | { address?: string; lat?: never; lng?: never }
  | { address?: never; lat?: number; lng?: number };

type LocationMode = "address" | "coordinates";
type GeolocationFeedback = "unsupported" | "denied" | "unavailable" | "timeout";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isCompleteCoordinateConfig = (config: MireyeChatConfig) =>
  isFiniteNumber(config?.lat) && isFiniteNumber(config?.lng);

const parseCoordinate = (value: string, min: number, max: number) => {
  if (!value.trim()) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max
    ? parsed
    : undefined;
};

export const MireyeChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: MireyeChatConfig;
  updateConfig: (config: MireyeChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [mode, setMode] = useState<LocationMode>(() =>
    isCompleteCoordinateConfig(config) ? "coordinates" : "address"
  );
  const [addressDraft, setAddressDraft] = useState(config?.address ?? "");
  const [latitudeDraft, setLatitudeDraft] = useState(
    isFiniteNumber(config?.lat) ? String(config.lat) : ""
  );
  const [longitudeDraft, setLongitudeDraft] = useState(
    isFiniteNumber(config?.lng) ? String(config.lng) : ""
  );
  const [isLocating, setIsLocating] = useState(false);
  const [geolocationFeedback, setGeolocationFeedback] =
    useState<GeolocationFeedback | undefined>();

  useEffect(() => {
    if (typeof config?.address === "string") {
      setMode("address");
      if (addressDraft.trim() !== config.address) {
        setAddressDraft(config.address);
      }
      return;
    }

    if (isCompleteCoordinateConfig(config)) {
      setMode("coordinates");
      if (parseCoordinate(latitudeDraft, -90, 90) !== config.lat) {
        setLatitudeDraft(String(config.lat));
      }
      if (parseCoordinate(longitudeDraft, -180, 180) !== config.lng) {
        setLongitudeDraft(String(config.lng));
      }
    }
  }, [config, addressDraft, latitudeDraft, longitudeDraft]);

  const selectAddress = () => {
    setMode("address");
    setLatitudeDraft("");
    setLongitudeDraft("");

    const address = addressDraft.trim();
    updateConfig(address ? { address } : {});
  };

  const selectCoordinates = () => {
    setMode("coordinates");
    setAddressDraft("");

    const lat = parseCoordinate(latitudeDraft, -90, 90);
    const lng = parseCoordinate(longitudeDraft, -180, 180);
    updateConfig(lat !== undefined && lng !== undefined ? { lat, lng } : {});
  };

  const updateAddress = (value: string) => {
    setAddressDraft(value);
    const address = value.trim();
    updateConfig(address ? { address } : {});
  };

  const updateCoordinates = (nextLatitude: string, nextLongitude: string) => {
    const lat = parseCoordinate(nextLatitude, -90, 90);
    const lng = parseCoordinate(nextLongitude, -180, 180);
    updateConfig(lat !== undefined && lng !== undefined ? { lat, lng } : {});
  };

  const getCurrentLocation = () => {
    setMode("coordinates");
    setAddressDraft("");
    setGeolocationFeedback(undefined);
    updateConfig({});

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeolocationFeedback("unsupported");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        setLatitudeDraft(String(lat));
        setLongitudeDraft(String(lng));
        setIsLocating(false);
        updateConfig({ lat, lng });
      },
      (error) => {
        setIsLocating(false);
        setGeolocationFeedback(
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.TIMEOUT
              ? "timeout"
              : "unavailable"
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const geolocationMessage = geolocationFeedback
    ? {
        unsupported:
          t("providers:mireye.geolocationUnsupported") ??
          "Current location is not supported by this browser.",
        denied:
          t("providers:mireye.geolocationDenied") ??
          "Location permission was denied.",
        unavailable:
          t("providers:mireye.geolocationUnavailable") ??
          "Your current location could not be determined.",
        timeout:
          t("providers:mireye.geolocationTimeout") ??
          "Getting your current location timed out.",
      }[geolocationFeedback]
    : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("providers:mireye.addressTitle") ?? "Address"}
        description={
          t("providers:mireye.addressHint") ??
          "Use a complete US street address. Selecting this option removes any coordinates."
        }
        headerActions={
          <theme.Switch
            id="mireye-address-mode"
            checked={mode === "address"}
            onChange={(enabled) => {
              if (enabled) selectAddress();
            }}
          />
        }
      >
        <theme.Input
          label={t("providers:mireye.address") ?? "Address"}
          placeholder={
            t("providers:mireye.addressPlaceholder") ??
            "350 5th Ave, New York, NY 10118"
          }
          maxLength={256}
          disabled={mode !== "address"}
          value={addressDraft}
          onChange={(event: any) => updateAddress(event?.target?.value ?? "")}
        />
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:mireye.coordinatesTitle") ?? "Latitude and longitude"}
        description={
          t("providers:mireye.coordinatesHint") ??
          "Provide both coordinates. Selecting this option removes the address."
        }
        headerActions={
          <theme.Switch
            id="mireye-coordinates-mode"
            checked={mode === "coordinates"}
            onChange={(enabled) => {
              if (enabled) selectCoordinates();
            }}
          />
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <theme.Input
            label={t("providers:mireye.latitude") ?? "Latitude"}
            type="number"
            min={-90}
            max={90}
            step="any"
            placeholder="46.6"
            disabled={mode !== "coordinates"}
            value={latitudeDraft}
            onChange={(event: any) => {
              const value = event?.target?.value ?? "";
              setLatitudeDraft(value);
              updateCoordinates(value, longitudeDraft);
            }}
          />
          <theme.Input
            label={t("providers:mireye.longitude") ?? "Longitude"}
            type="number"
            min={-180}
            max={180}
            step="any"
            placeholder="-93.7"
            disabled={mode !== "coordinates"}
            value={longitudeDraft}
            onChange={(event: any) => {
              const value = event?.target?.value ?? "";
              setLongitudeDraft(value);
              updateCoordinates(latitudeDraft, value);
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, marginTop: 12 }}>
          <theme.Button
            type="button"
            size="small"
            variant="subtle"
            disabled={isLocating}
            onClick={getCurrentLocation}
          >
            {isLocating
              ? t("providers:mireye.gettingCurrent") ?? "Getting current location..."
              : t("providers:mireye.getCurrent") ?? "Get current"}
          </theme.Button>
          {geolocationMessage ? (
            <theme.Text as="p" style={{ margin: 0 }}>
              {geolocationMessage}
            </theme.Text>
          ) : null}
        </div>
      </theme.Card>
    </div>
  );
};
