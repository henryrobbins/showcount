'use client';

import { useEffect, useRef, useState } from 'react';

interface VenueAutocompleteProps {
  onSelect: (place: {
    name: string;
    city: string | null;
    state: string | null;
    country: string;
    placeId: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialValue?: string;
  className?: string;
  placeholder?: string;
}

function VenueAutocomplete({ 
  onSelect, 
  initialValue = '',
  className = '',
  placeholder = 'Search for a venue...'
}: VenueAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!window.google?.maps?.places) {
      setError('Google Maps not loaded');
      return;
    }
    
    if (!inputRef.current) return;
    
    // Initialize Places Autocomplete
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment'], // Focus on venues/businesses
      fields: ['place_id', 'name', 'formatted_address', 'address_components', 'geometry'],
    });
    
    // Listen for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        setError('No details available for input');
        return;
      }
      
      // Extract address components
      const getComponent = (types: string[]) => 
        place.address_components?.find(c => 
          types.some(t => c.types.includes(t))
        );
      
      const city = getComponent(['locality', 'sublocality'])?.long_name || null;
      const state = getComponent(['administrative_area_level_1'])?.short_name || null;
      const country = getComponent(['country'])?.long_name || 'Unknown';
      
      onSelect({
        name: place.name || '',
        city,
        state,
        country,
        placeId: place.place_id || '',
        formattedAddress: place.formatted_address || '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      });
      
      setError(null);
    });
    
    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [onSelect]);
  
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        defaultValue={initialValue}
        placeholder={placeholder}
        className={className}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

export default VenueAutocomplete;
