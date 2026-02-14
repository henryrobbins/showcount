import type { Venue } from './venue';

// Central show represents a unique show (one artist at one venue on one date)
export interface CentralShow {
  id: string;
  show_id: string;
  date: string;
  artist: string;
  venue_id: string;
  created_at: string;
  updated_at: string;
}

// User show represents a user's attendance at one or more shows
export interface UserShow {
  id: string;
  clerk_user_id: string;
  show_ids: string[];
  notes: string | null;
  rating: string | null;
  created_at: string;
  updated_at: string;
}

// Extended type for display with joined central shows and venue data
export interface UserShowWithDetails extends UserShow {
  shows: (CentralShow & { venue: Venue })[];
}

// Legacy Show type for backward compatibility
export interface Show {
  id: string;
  clerk_user_id: string;
  date: string;
  artists: string[];
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CSVRow {
  date: string;
  artist: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  notes?: string;
  rating?: string;
}

export interface ParsedCSVData {
  shows: ShowInsert[];
  totalRows: number;
}

export interface ShowInsert {
  clerk_user_id: string;
  date: string;
  artists: string[];
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  notes: string | null;
  rating?: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
