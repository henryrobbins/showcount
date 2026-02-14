'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RatingSystemConfig } from '@/types/rating';

interface RatingInputProps {
  value: string | null;
  config: RatingSystemConfig | null;
  onChange: (value: string | null) => void;
  label?: string;
  id?: string;
}

export default function RatingInput({
  value,
  config,
  onChange,
  label = 'Rating',
  id = 'rating',
}: RatingInputProps) {
  if (!config) {
    return null;
  }

  const handleChange = (newValue: string) => {
    // Empty string should be treated as null
    onChange(newValue === '' ? null : newValue);
  };

  const renderInput = () => {
    switch (config.type) {
      case 'ordered_list': {
        return (
          <select
            id={id}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-black bg-white px-3 py-2 text-base font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">No rating</option>
            {config.config.values.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        );
      }

      case 'numeric_range': {
        const { min, max, allow_decimals } = config.config;
        const step = allow_decimals ? 0.1 : 1;

        return (
          <Input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`${min} - ${max}`}
            className="font-mono"
          />
        );
      }

      case 'numeric_unbounded': {
        const { allow_decimals } = config.config;
        const step = allow_decimals ? 0.1 : 1;

        return (
          <Input
            id={id}
            type="number"
            step={step}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter rating"
            className="font-mono"
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-mono">
        {label} (optional)
      </Label>
      {renderInput()}
      {config.type === 'numeric_range' && (
        <p className="text-xs text-gray-600 font-mono">
          {config.config.direction === 'higher_is_better'
            ? 'Higher is better'
            : 'Lower is better'}
        </p>
      )}
      {config.type === 'numeric_unbounded' && (
        <p className="text-xs text-gray-600 font-mono">
          {config.config.direction === 'higher_is_better'
            ? 'Higher is better'
            : 'Lower is better'}
        </p>
      )}
    </div>
  );
}
