import * as React from "react";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBox = ({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  autoFocus,
}: SearchBoxProps) => (
  <input
    type="search"
    className={`form-control ${className ?? ""}`}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    autoFocus={autoFocus}
    aria-label={placeholder}
  />
);
