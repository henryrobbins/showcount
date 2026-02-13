export type RatingSystemType =
  | 'ordered_list'
  | 'numeric_range'
  | 'numeric_unbounded';

export interface OrderedListConfig {
  values: string[]; // e.g., ["AAA", "AA", "A", "B", "C"]
}

export interface NumericRangeConfig {
  min: number;
  max: number;
  direction: 'higher_is_better' | 'lower_is_better';
  allow_decimals?: boolean;
}

export interface NumericUnboundedConfig {
  direction: 'higher_is_better' | 'lower_is_better';
  allow_decimals?: boolean;
}

export type RatingSystemConfig =
  | { type: 'ordered_list'; config: OrderedListConfig }
  | { type: 'numeric_range'; config: NumericRangeConfig }
  | { type: 'numeric_unbounded'; config: NumericUnboundedConfig };
