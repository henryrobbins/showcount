'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  RatingSystemType,
  RatingSystemConfig,
  OrderedListConfig,
  NumericRangeConfig,
  NumericUnboundedConfig,
} from '@/types/rating';

interface RatingSystemConfigProps {
  type: RatingSystemType | null;
  config: RatingSystemConfig | null;
  onChange: (type: RatingSystemType, config: RatingSystemConfig) => void;
}

export default function RatingSystemConfig({
  type,
  config,
  onChange,
}: RatingSystemConfigProps) {
  const [selectedType, setSelectedType] = useState<RatingSystemType>(
    type || 'ordered_list'
  );

  // Ordered list state
  const [orderedListValues, setOrderedListValues] = useState<string>('');

  // Numeric range state
  const [numericMin, setNumericMin] = useState<number>(1);
  const [numericMax, setNumericMax] = useState<number>(10);
  const [numericDirection, setNumericDirection] = useState<
    'higher_is_better' | 'lower_is_better'
  >('higher_is_better');
  const [numericAllowDecimals, setNumericAllowDecimals] = useState<boolean>(false);

  // Numeric unbounded state
  const [unboundedDirection, setUnboundedDirection] = useState<
    'higher_is_better' | 'lower_is_better'
  >('higher_is_better');
  const [unboundedAllowDecimals, setUnboundedAllowDecimals] = useState<boolean>(false);

  const [validationError, setValidationError] = useState<string>('');

  // Initialize from existing config
  useEffect(() => {
    if (config) {
      setSelectedType(config.type);
      switch (config.type) {
        case 'ordered_list':
          setOrderedListValues(config.config.values.join(', '));
          break;
        case 'numeric_range':
          setNumericMin(config.config.min);
          setNumericMax(config.config.max);
          setNumericDirection(config.config.direction);
          setNumericAllowDecimals(config.config.allow_decimals || false);
          break;
        case 'numeric_unbounded':
          setUnboundedDirection(config.config.direction);
          setUnboundedAllowDecimals(config.config.allow_decimals || false);
          break;
      }
    } else {
      // Set default 5-star system
      setSelectedType('ordered_list');
      setOrderedListValues('*****, ****, ***, **, *');
    }
  }, [config]);

  const handleTypeChange = (newType: RatingSystemType) => {
    setSelectedType(newType);
    setValidationError('');
    
    // Set defaults for the new type
    if (newType === 'ordered_list' && !orderedListValues) {
      setOrderedListValues('*****, ****, ***, **, *');
    }
  };

  const handleApply = () => {
    setValidationError('');

    try {
      let newConfig: RatingSystemConfig;

      switch (selectedType) {
        case 'ordered_list': {
          const values = orderedListValues
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v !== '');

          if (values.length < 2) {
            setValidationError('Must provide at least 2 values');
            return;
          }

          const orderedConfig: OrderedListConfig = { values };
          newConfig = { type: 'ordered_list', config: orderedConfig };
          break;
        }

        case 'numeric_range': {
          if (numericMin >= numericMax) {
            setValidationError('Minimum must be less than maximum');
            return;
          }

          const rangeConfig: NumericRangeConfig = {
            min: numericMin,
            max: numericMax,
            direction: numericDirection,
            allow_decimals: numericAllowDecimals,
          };
          newConfig = { type: 'numeric_range', config: rangeConfig };
          break;
        }

        case 'numeric_unbounded': {
          const unboundedConfig: NumericUnboundedConfig = {
            direction: unboundedDirection,
            allow_decimals: unboundedAllowDecimals,
          };
          newConfig = { type: 'numeric_unbounded', config: unboundedConfig };
          break;
        }

        default:
          return;
      }

      onChange(selectedType, newConfig);
    } catch (error) {
      setValidationError('Invalid configuration');
    }
  };

  return (
    <div className="space-y-4 border border-black p-4">
      <div>
        <Label className="font-mono text-sm mb-2 block">Rating System Type</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="ordered_list"
              name="rating_type"
              checked={selectedType === 'ordered_list'}
              onChange={() => handleTypeChange('ordered_list')}
              className="w-4 h-4"
            />
            <Label htmlFor="ordered_list" className="font-mono cursor-pointer">
              Ordered List (e.g., A, B, C or ★★★★★)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="numeric_range"
              name="rating_type"
              checked={selectedType === 'numeric_range'}
              onChange={() => handleTypeChange('numeric_range')}
              className="w-4 h-4"
            />
            <Label htmlFor="numeric_range" className="font-mono cursor-pointer">
              Numeric Range (e.g., 1-10)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="numeric_unbounded"
              name="rating_type"
              checked={selectedType === 'numeric_unbounded'}
              onChange={() => handleTypeChange('numeric_unbounded')}
              className="w-4 h-4"
            />
            <Label htmlFor="numeric_unbounded" className="font-mono cursor-pointer">
              Numeric Unbounded (any number)
            </Label>
          </div>
        </div>
      </div>

      <div className="border-t border-black pt-4">
        {selectedType === 'ordered_list' && (
          <div className="space-y-2">
            <Label htmlFor="ordered-values" className="font-mono">
              Values (comma-separated, best to worst)
            </Label>
            <Input
              id="ordered-values"
              value={orderedListValues}
              onChange={(e) => setOrderedListValues(e.target.value)}
              placeholder="*****, ****, ***, **, *"
              className="font-mono"
            />
            <p className="text-xs text-gray-600 font-mono">
              First value is the best rating, last is the worst
            </p>
          </div>
        )}

        {selectedType === 'numeric_range' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeric-min" className="font-mono">
                  Minimum
                </Label>
                <Input
                  id="numeric-min"
                  type="number"
                  value={numericMin}
                  onChange={(e) => setNumericMin(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="numeric-max" className="font-mono">
                  Maximum
                </Label>
                <Input
                  id="numeric-max"
                  type="number"
                  value={numericMax}
                  onChange={(e) => setNumericMax(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono">Direction</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="higher-better"
                  name="numeric_direction"
                  checked={numericDirection === 'higher_is_better'}
                  onChange={() => setNumericDirection('higher_is_better')}
                  className="w-4 h-4"
                />
                <Label htmlFor="higher-better" className="font-mono cursor-pointer">
                  Higher is better
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="lower-better"
                  name="numeric_direction"
                  checked={numericDirection === 'lower_is_better'}
                  onChange={() => setNumericDirection('lower_is_better')}
                  className="w-4 h-4"
                />
                <Label htmlFor="lower-better" className="font-mono cursor-pointer">
                  Lower is better
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="numeric-decimals"
                checked={numericAllowDecimals}
                onCheckedChange={(checked) =>
                  setNumericAllowDecimals(checked === true)
                }
              />
              <Label htmlFor="numeric-decimals" className="font-mono cursor-pointer">
                Allow decimal values
              </Label>
            </div>
          </div>
        )}

        {selectedType === 'numeric_unbounded' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono">Direction</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="unbounded-higher-better"
                  name="unbounded_direction"
                  checked={unboundedDirection === 'higher_is_better'}
                  onChange={() => setUnboundedDirection('higher_is_better')}
                  className="w-4 h-4"
                />
                <Label
                  htmlFor="unbounded-higher-better"
                  className="font-mono cursor-pointer"
                >
                  Higher is better
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="unbounded-lower-better"
                  name="unbounded_direction"
                  checked={unboundedDirection === 'lower_is_better'}
                  onChange={() => setUnboundedDirection('lower_is_better')}
                  className="w-4 h-4"
                />
                <Label
                  htmlFor="unbounded-lower-better"
                  className="font-mono cursor-pointer"
                >
                  Lower is better
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="unbounded-decimals"
                checked={unboundedAllowDecimals}
                onCheckedChange={(checked) =>
                  setUnboundedAllowDecimals(checked === true)
                }
              />
              <Label htmlFor="unbounded-decimals" className="font-mono cursor-pointer">
                Allow decimal values
              </Label>
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <p className="text-red-600 text-sm font-mono border border-red-600 p-2">
          {validationError}
        </p>
      )}

      <Button
        onClick={handleApply}
        variant="outline"
        className="w-full font-mono border-black hover:bg-black hover:text-white"
      >
        Apply Configuration
      </Button>
    </div>
  );
}
