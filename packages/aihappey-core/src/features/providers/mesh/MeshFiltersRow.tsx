import type { ChangeEvent } from "react";
import {
  PROVIDER_LOCATION_ALL_FILTER_VALUE,
  toggleProviderLocationMultiSelectValue,
  useTheme,
} from "aihappey-components";
import { useTranslation } from "react-i18next";

type Props = {
  search: string;
  onSearchChange: (next: string) => void;
  searchAutoFocus?: boolean;
  selectedCountries: string[];
  selectedRegions: string[];
  countryOptions: string[];
  regionOptions: string[];
  countryCounts?: Record<string, number>;
  regionCounts?: Record<string, number>;
  onCountriesChange: (next: string[]) => void;
  onRegionsChange: (next: string[]) => void;
};

const getMultiSelectValueTitle = ({
  selected,
  allValue,
  allLabel,
  getLabel,
}: {
  selected: string[];
  allValue: string;
  allLabel: string;
  getLabel: (value: string) => string;
}) => {
  if (selected.includes(allValue)) return allLabel;
  return selected.map((value) => getLabel(value)).join(", ");
};

export const MeshFiltersRow = ({
  search,
  onSearchChange,
  searchAutoFocus,
  selectedCountries,
  selectedRegions,
  countryOptions,
  regionOptions,
  countryCounts,
  regionCounts,
  onCountriesChange,
  onRegionsChange,
}: Props) => {
  const { SearchBox, Select } = useTheme();
  const SelectComponent = Select || "select";
  const { t } = useTranslation();

  const resolveSelectionValue = (e: ChangeEvent<HTMLSelectElement> | any) =>
    e?.target?.value ?? e?.currentTarget?.value ?? e;

  const sortedCountryOptions = [...countryOptions].sort((a, b) =>
    t("regional:countries." + a).localeCompare(
      t("regional:countries." + b),
      undefined,
      { sensitivity: "base" }
    )
  );

  const formatCountedLabel = (label: string, count?: number) =>
    typeof count === "number" ? `${label} (${count})` : label;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div style={{ flex: "1 1 360px", minWidth: 240, maxWidth: 420 }}>
        <SearchBox
          value={search}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
          autoFocus={searchAutoFocus}
        />
      </div>

      <div style={{ width: 240, maxWidth: "100%" }}>
        <SelectComponent
          values={selectedCountries}
          multiselect={true}
          size="small"
          label={t("countryOfOrigin")}
          valueTitle={getMultiSelectValueTitle({
            selected: selectedCountries,
            allValue: PROVIDER_LOCATION_ALL_FILTER_VALUE,
            allLabel: t("all"),
            getLabel: (country) => t("regional:countries." + country),
          })}
          onChange={(e: ChangeEvent<HTMLSelectElement> | any) => {
            const selectedValue = resolveSelectionValue(e);
            if (typeof selectedValue !== "string") return;
            if (
              selectedValue !== PROVIDER_LOCATION_ALL_FILTER_VALUE &&
              (countryCounts?.[selectedValue] ?? 0) === 0 &&
              !selectedCountries.includes(selectedValue)
            ) return;
            onCountriesChange(
              toggleProviderLocationMultiSelectValue(
                selectedCountries,
                selectedValue,
                PROVIDER_LOCATION_ALL_FILTER_VALUE
              )
            );
          }}
          aria-label="Mesh provider country filter"
        >
          <option value={PROVIDER_LOCATION_ALL_FILTER_VALUE}>{t("all")}</option>
          {sortedCountryOptions.map((country) => (
            <option
              key={country}
              value={country}
              disabled={
                (countryCounts?.[country] ?? 1) === 0 &&
                !selectedCountries.includes(country)
              }
            >
              {formatCountedLabel(t("regional:countries." + country), countryCounts?.[country])}
            </option>
          ))}
        </SelectComponent>
      </div>

      <div style={{ width: 240, maxWidth: "100%" }}>
        <SelectComponent
          values={selectedRegions}
          multiselect={true}
          size="small"
          label={t("aiRegion")}
          valueTitle={getMultiSelectValueTitle({
            selected: selectedRegions,
            allValue: PROVIDER_LOCATION_ALL_FILTER_VALUE,
            allLabel: t("all"),
            getLabel: (region) => t("regional:regions." + region),
          })}
          onChange={(e: ChangeEvent<HTMLSelectElement> | any) => {
            const selectedValue = resolveSelectionValue(e);
            if (typeof selectedValue !== "string") return;
            if (
              selectedValue !== PROVIDER_LOCATION_ALL_FILTER_VALUE &&
              (regionCounts?.[selectedValue] ?? 0) === 0 &&
              !selectedRegions.includes(selectedValue)
            ) return;
            onRegionsChange(
              toggleProviderLocationMultiSelectValue(
                selectedRegions,
                selectedValue,
                PROVIDER_LOCATION_ALL_FILTER_VALUE
              )
            );
          }}
          aria-label="Mesh provider inference region filter"
        >
          <option value={PROVIDER_LOCATION_ALL_FILTER_VALUE}>{t("all")}</option>
          {regionOptions.map((region) => (
            <option
              key={region}
              value={region}
              disabled={
                (regionCounts?.[region] ?? 1) === 0 &&
                !selectedRegions.includes(region)
              }
            >
              {formatCountedLabel(t("regional:regions." + region), regionCounts?.[region])}
            </option>
          ))}
        </SelectComponent>
      </div>
    </div>
  );
};

