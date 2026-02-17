import type { ChangeEvent } from "react";
import { useTheme } from "../theme/ThemeContext";

export const PROVIDER_LOCATION_ALL_FILTER_VALUE = "__ALL__";

export const toggleProviderLocationMultiSelectValue = (
  current: string[],
  value: string,
  allValue = PROVIDER_LOCATION_ALL_FILTER_VALUE
) => {
  if (value === allValue) {
    return [allValue];
  }

  const withoutAll = current.filter((v) => v !== allValue);

  if (withoutAll.includes(value)) {
    const next = withoutAll.filter((v) => v !== value);
    return next.length > 0 ? next : [allValue];
  }

  return [...withoutAll, value];
};

type ProviderLocationFiltersProps = {
  selectedCountries: string[];
  selectedRegions: string[];
  countryOptions: string[];
  regionOptions: string[];
  onCountriesChange: (next: string[]) => void;
  onRegionsChange: (next: string[]) => void;
  allLabel: string;
  countryLabel: string;
  regionLabel: string;
  getCountryLabel: (country: string) => string;
  getRegionLabel: (region: string) => string;
  countryAriaLabel?: string;
  regionAriaLabel?: string;
  allValue?: string;
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
  if (selected.includes(allValue)) {
    return allLabel;
  }

  return selected.map((value) => getLabel(value)).join(", ");
};

export const ProviderLocationFilters = ({
  selectedCountries,
  selectedRegions,
  countryOptions,
  regionOptions,
  onCountriesChange,
  onRegionsChange,
  allLabel,
  countryLabel,
  regionLabel,
  getCountryLabel,
  getRegionLabel,
  countryAriaLabel = "Provider country filter",
  regionAriaLabel = "Provider inference region filter",
  allValue = PROVIDER_LOCATION_ALL_FILTER_VALUE,
}: ProviderLocationFiltersProps) => {
  const { Select } = useTheme();
  const SelectComponent = Select || "select";

  const resolveSelectionValue = (e: ChangeEvent<HTMLSelectElement> | any) =>
    e?.target?.value ?? e?.currentTarget?.value ?? e;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 24,
        marginBottom: 16,
      }}
    >
      <div style={{ width: 240, maxWidth: "100%" }}>
        <SelectComponent
          values={selectedCountries}
          multiselect={true}
          size="small"
          label={countryLabel}
          valueTitle={getMultiSelectValueTitle({
            selected: selectedCountries,
            allValue,
            allLabel,
            getLabel: getCountryLabel,
          })}
          onChange={(e: ChangeEvent<HTMLSelectElement> | any) => {
            const selectedValue = resolveSelectionValue(e);
            if (typeof selectedValue !== "string") return;

            onCountriesChange(
              toggleProviderLocationMultiSelectValue(
                selectedCountries,
                selectedValue,
                allValue
              )
            );
          }}
          aria-label={countryAriaLabel}
        >
          <option value={allValue}>{allLabel}</option>
          {countryOptions.map((country) => (
            <option key={country} value={country}>
              {getCountryLabel(country)}
            </option>
          ))}
        </SelectComponent>
      </div>

      <div style={{ width: 240, maxWidth: "100%" }}>
        <SelectComponent
          values={selectedRegions}
          multiselect={true}
          size="small"
          label={regionLabel}
          valueTitle={getMultiSelectValueTitle({
            selected: selectedRegions,
            allValue,
            allLabel,
            getLabel: getRegionLabel,
          })}
          onChange={(e: ChangeEvent<HTMLSelectElement> | any) => {
            const selectedValue = resolveSelectionValue(e);
            if (typeof selectedValue !== "string") return;

            onRegionsChange(
              toggleProviderLocationMultiSelectValue(
                selectedRegions,
                selectedValue,
                allValue
              )
            );
          }}
          aria-label={regionAriaLabel}
        >
          <option value={allValue}>{allLabel}</option>
          {regionOptions.map((region) => (
            <option key={region} value={region}>
              {getRegionLabel(region)}
            </option>
          ))}
        </SelectComponent>
      </div>
    </div>
  );
};

