export interface Database {
  public: {
    Tables: {
      shows: {
        Row: {
          id: string;
          clerk_user_id: string;
          date: string;
          artists: string[];
          venue: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          venue_id: string | null;
          created_at: string;
          updated_at: string;
          notes?: string | null;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          date: string;
          artists: string[];
          venue?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          venue_id?: string | null;
          created_at?: string;
          updated_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          date?: string;
          artists?: string[];
          venue?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          venue_id?: string | null;
          created_at?: string;
          updated_at?: string;
          notes?: string | null;
        };
      };
      venues: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          country: string;
          latitude: number | null;
          longitude: number | null;
          osm_place_id: string | null;
          osm_display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city?: string | null;
          country: string;
          latitude?: number | null;
          longitude?: number | null;
          osm_place_id?: string | null;
          osm_display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          osm_place_id?: string | null;
          osm_display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
