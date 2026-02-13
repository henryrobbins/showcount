import type { Database } from './database';

export type Venue = Database['public']['Tables']['venues']['Row'];
export type VenueInsert = Database['public']['Tables']['venues']['Insert'];
export type VenueUpdate = Database['public']['Tables']['venues']['Update'];

export interface VenueSearchParams {
  name: string;
  city?: string | null;
  country?: string | null;
}

export interface OSMSearchResult {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    country_code?: string;
  };
}
