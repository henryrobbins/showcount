import type {
  RatingSystemConfig,
  OrderedListConfig,
  NumericRangeConfig,
  NumericUnboundedConfig,
  RatingSystemType,
} from '@/types/rating';

/**
 * Validates that a rating system configuration is well-formed
 */
export function validateRatingSystemConfig(
  type: RatingSystemType,
  config: unknown,
): boolean {
  if (!config || typeof config !== 'object') {
    return false;
  }

  switch (type) {
    case 'ordered_list': {
      const orderedConfig = config as OrderedListConfig;
      return (
        Array.isArray(orderedConfig.values) &&
        orderedConfig.values.length >= 2 &&
        orderedConfig.values.every((v) => typeof v === 'string' && v.length > 0)
      );
    }

    case 'numeric_range': {
      const rangeConfig = config as NumericRangeConfig;
      return (
        typeof rangeConfig.min === 'number' &&
        typeof rangeConfig.max === 'number' &&
        rangeConfig.min < rangeConfig.max &&
        (rangeConfig.direction === 'higher_is_better' ||
          rangeConfig.direction === 'lower_is_better')
      );
    }

    case 'numeric_unbounded': {
      const unboundedConfig = config as NumericUnboundedConfig;
      return (
        unboundedConfig.direction === 'higher_is_better' ||
        unboundedConfig.direction === 'lower_is_better'
      );
    }

    default:
      return false;
  }
}

/**
 * Validates that a rating value is valid for the given rating system
 */
export function validateRatingValue(
  value: string | null,
  systemConfig: RatingSystemConfig | null,
): boolean {
  // Null/empty ratings are always valid (ratings are optional)
  if (!value || value === '') {
    return true;
  }

  // If no rating system is configured, ratings are not allowed
  if (!systemConfig) {
    return false;
  }

  switch (systemConfig.type) {
    case 'ordered_list': {
      return systemConfig.config.values.includes(value);
    }

    case 'numeric_range': {
      const num = Number.parseFloat(value);
      if (Number.isNaN(num)) {
        return false;
      }

      // Check if decimals are allowed
      if (
        !systemConfig.config.allow_decimals &&
        !Number.isInteger(num)
      ) {
        return false;
      }

      // Check if within range
      return (
        num >= systemConfig.config.min && num <= systemConfig.config.max
      );
    }

    case 'numeric_unbounded': {
      const num = Number.parseFloat(value);
      if (Number.isNaN(num)) {
        return false;
      }

      // Check if decimals are allowed
      if (
        !systemConfig.config.allow_decimals &&
        !Number.isInteger(num)
      ) {
        return false;
      }

      return true;
    }

    default:
      return false;
  }
}

/**
 * Returns the display value for a rating (same as input for now, but could be customized)
 */
export function getRatingDisplayValue(
  value: string | null,
  systemConfig: RatingSystemConfig | null,
): string {
  if (!value || !systemConfig) {
    return '-';
  }

  return value;
}

/**
 * Compares two ratings according to the rating system
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 * Better ratings are "greater than" worse ratings
 */
export function compareRatings(
  a: string | null,
  b: string | null,
  systemConfig: RatingSystemConfig | null,
): number {
  // Handle null cases
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;

  if (!systemConfig) return 0;

  switch (systemConfig.type) {
    case 'ordered_list': {
      const indexA = systemConfig.config.values.indexOf(a);
      const indexB = systemConfig.config.values.indexOf(b);

      // Invalid values go to the end
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return -1;
      if (indexB === -1) return 1;

      // Lower index = better rating (first in list is best)
      return indexA - indexB;
    }

    case 'numeric_range':
    case 'numeric_unbounded': {
      const numA = Number.parseFloat(a);
      const numB = Number.parseFloat(b);

      if (Number.isNaN(numA) && Number.isNaN(numB)) return 0;
      if (Number.isNaN(numA)) return -1;
      if (Number.isNaN(numB)) return 1;

      const direction =
        systemConfig.type === 'numeric_range'
          ? systemConfig.config.direction
          : systemConfig.config.direction;

      if (direction === 'higher_is_better') {
        return numA - numB;
      }
      return numB - numA;
    }

    default:
      return 0;
  }
}
