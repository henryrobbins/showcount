export interface Database {
  public: {
    Tables: {
      central_shows: {
        Row: {
          id: string;
          show_id: string;
          date: string;
          artist: string;
          venue_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          show_id: string;
          date: string;
          artist: string;
          venue_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          show_id?: string;
          date?: string;
          artist?: string;
          venue_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_shows: {
        Row: {
          id: string;
          clerk_user_id: string;
          show_ids: string[];
          notes: string | null;
          created_at: string;
          updated_at: string;
          // Legacy columns (kept for backward compatibility during migration)
          date: string | null;
          artists: string[] | null;
          venue: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          venue_id: string | null;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          show_ids: string[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          // Legacy columns
          date?: string | null;
          artists?: string[] | null;
          venue?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          venue_id?: string | null;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          show_ids?: string[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          // Legacy columns
          date?: string | null;
          artists?: string[] | null;
          venue?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          venue_id?: string | null;
        };
      };
      // Legacy alias for backward compatibility
      shows: {
        Row: Database['public']['Tables']['user_shows']['Row'];
        Insert: Database['public']['Tables']['user_shows']['Insert'];
        Update: Database['public']['Tables']['user_shows']['Update'];
      };
      venues: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          state: string | null;
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
          state?: string | null;
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
          state?: string | null;
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
