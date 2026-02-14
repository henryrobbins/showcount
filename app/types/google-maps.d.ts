// TypeScript declarations for Google Maps JavaScript API
// This allows TypeScript to recognize the global google object

declare namespace google {
  namespace maps {
    class LatLng {
      lat(): number;
      lng(): number;
    }

    namespace places {
      interface PlaceResult {
        place_id?: string;
        name?: string;
        formatted_address?: string;
        geometry?: {
          location?: LatLng;
        };
        address_components?: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
      }

      interface AutocompleteOptions {
        types?: string[];
        fields?: string[];
      }

      class Autocomplete {
        constructor(input: HTMLInputElement, options?: AutocompleteOptions);
        addListener(event: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }
    }

    namespace event {
      function clearInstanceListeners(instance: any): void;
    }
  }
}

interface Window {
  google?: typeof google;
}
