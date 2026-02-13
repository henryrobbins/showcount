export interface Show {
  id: string;
  clerk_user_id: string;
  date: string;
  artists: string[];
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
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
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
