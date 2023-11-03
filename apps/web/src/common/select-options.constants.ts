import { CSSProperties } from 'react';

export type OptionValueType = string | number | null;

export interface StyleOption {
  style?: CSSProperties;
}

export interface SelectOption<T extends OptionValueType> extends StyleOption {
  value: T;
  label?: string;
}
